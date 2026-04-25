import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { env } from "../../lib/env.js";
import { VerifyTokenUseCase } from "./application/verify-token.use-case.js";
import { SupabaseAuthRepository } from "./infrastructure/supabase-auth.repository.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      role?: string;
    };
  }
}

/**
 * Faz parse local do payload JWT (sem verificar assinatura).
 * Usado como fallback quando a API do Supabase não está configurada.
 */
function parseJwtPayload(token: string): { sub?: string; email?: string; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    return null;
  }
}

export async function authPlugin(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Instancia o repositório e o caso de uso (Clean Architecture)
  const authRepository = new SupabaseAuthRepository(
    env.SUPABASE_URL ?? "",
    env.SUPABASE_ANON_KEY ?? ""
  );
  const verifyTokenUseCase = new VerifyTokenUseCase(authRepository);

  fastify.decorateRequest("user", undefined);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.substring(7);

    // Tenta verificar o token via Supabase Auth API (seguro)
    const user = await verifyTokenUseCase.execute(token);

    if (user) {
      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      return;
    }

    // Fallback: parse local do JWT (não verifica assinatura)
    if (!env.SUPABASE_URL) {
      const payload = parseJwtPayload(token);
      if (payload?.sub) {
        request.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role || "user",
        };
      }
    }
  });
}
