import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./lib/env.js";
import { authPlugin } from "./modules/auth/plugin.js";
import { eventRoutes } from "./modules/events/routes.js";
import { recommendationRoutes } from "./modules/recommendations/routes.js";
import { profileRoutes } from "./modules/profiles/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o build do frontend (dist na raiz do projeto)
const staticPath = path.resolve(__dirname, "../../../dist");

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS para permitir requisições do frontend
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Plugin de autenticação
  await app.register(authPlugin);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    service: "mesa-api",
    port: env.PORT,
    timestamp: new Date().toISOString(),
  }));

  // Rotas da API (registradas antes do static para ter precedência)
  await app.register(eventRoutes, { prefix: "/events" });
  await app.register(recommendationRoutes);
  await app.register(profileRoutes);

  // Servir build estático do frontend (SPA)
  await app.register(fastifyStatic, {
    root: staticPath,
    wildcard: false, // Desabilita wildcard para podermos controlar o catch-all
  });

  // Catch-all para SPA: retorna index.html para rotas não-API
  // Isso permite que o React Router lide com rotas como /dashboard, /perfil, etc.
  app.get("/*", async (request, reply) => {
    const url = request.url;

    // Não intercepta rotas da API
    if (
      url.startsWith("/health") ||
      url.startsWith("/events") ||
      url.startsWith("/mesas/recomendadas") ||
      url.startsWith("/auth") ||
      url.startsWith("/profiles")
    ) {
      return reply.callNotFound();
    }

    return reply.sendFile("index.html");
  });

  return app;
}
