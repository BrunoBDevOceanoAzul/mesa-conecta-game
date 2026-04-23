import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env.js";
import { authPlugin } from "./modules/auth/plugin.js";
import { eventRoutes } from "./modules/events/routes.js";
import { recommendationRoutes } from "./modules/recommendations/routes.js";

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

  // Rotas de eventos
  await app.register(eventRoutes, { prefix: "/events" });

  // Rotas de recomendações
  await app.register(recommendationRoutes);

  return app;
}
