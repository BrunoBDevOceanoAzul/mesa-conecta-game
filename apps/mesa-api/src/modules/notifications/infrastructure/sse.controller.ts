import { FastifyInstance } from "fastify";
import { subscribeUser } from "./sse.event-bus.js";

export async function sseController(fastify: FastifyInstance) {
  fastify.get("/events/stream", async (request, reply) => {
    const user = request.user;
    if (!user?.id) {
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

    subscribeUser(user.id, reply);

    // Mantém a conexão aberta
    await new Promise(() => {});
  });
}
