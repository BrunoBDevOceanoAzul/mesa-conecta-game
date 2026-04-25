import { FastifyInstance } from "fastify";
import { subscribeUser } from "./sse.event-bus.js";
import { VerifyTokenUseCase } from "../../auth/application/verify-token.use-case.js";
import { SupabaseAuthRepository } from "../../auth/infrastructure/supabase-auth.repository.js";
import { env } from "../../../lib/env.js";

export async function sseController(fastify: FastifyInstance) {
  fastify.get("/events/stream", async (request, reply) => {
    // SSE não suporta headers customizados.
    // Tentamos token via query parameter como fallback.
    let userId = request.user?.id;

    if (!userId) {
      const token = (request.query as Record<string, string>)?.token;
      if (token) {
        try {
          const authRepo = new SupabaseAuthRepository(
            env.SUPABASE_URL ?? "",
            env.SUPABASE_ANON_KEY ?? ""
          );
          const verifyUseCase = new VerifyTokenUseCase(authRepo);
          const user = await verifyUseCase.execute(token);
          if (user) {
            userId = user.id;
          }
        } catch {
          // Token inválido, continua não autorizado
        }
      }
    }

    if (!userId) {
      return reply.status(401).send({
        ok: false,
        error: "Unauthorized",
      });
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    reply.raw.write("event: connected\ndata: \"SSE connection established\"\n\n");

    subscribeUser(userId, reply);

    // Mantém a conexão aberta
    await new Promise(() => {});
  });
}
