import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { env } from "../../lib/env.js";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

interface SupabaseUserResponse {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Verifica um JWT do Supabase via API Auth.
 * Retorna os dados do usuário se válido, ou null se inválido/inacessível.
 */
async function verifySupabaseToken(token: string): Promise<SupabaseUserResponse | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SupabaseUserResponse;
    return data;
  } catch {
    return null;
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

export async function authPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.decorateRequest("user", null);

  fastify.addHook("onRequest", async (request: AuthenticatedRequest, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.substring(7);

    // Tenta verificar o token via Supabase Auth API (seguro)
    const userData = await verifySupabaseToken(token);

    if (userData) {
      request.user = {
        id: userData.id,
        email: userData.email,
        role: userData.role || "user",
      };
      return;
    }

    // Fallback: parse local do JWT (não verifica assinatura)
    // Isso permite desenvolvimento local sem depender da API do Supabase,
    // mas em produção a verificação via API é preferida.
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
