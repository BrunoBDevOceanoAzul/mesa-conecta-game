import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./lib/env.js";
import { authPlugin } from "./modules/auth/plugin.js";
import { eventController } from "./modules/events/infrastructure/event.controller.js";
import { recommendationsController } from "./modules/recommendations/infrastructure/recommendations.controller.js";
import { profileController } from "./modules/profiles/infrastructure/profile.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o build do frontend (dist na raiz do projeto)
const staticPath = path.resolve(__dirname, "../../../dist");
const hasEmbeddedFrontend = fs.existsSync(staticPath);

async function registerApiRoutes(app: FastifyInstance, prefix = "") {
  const routePrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

  app.get(`${routePrefix}/health`, async () => ({
    status: "ok",
    service: "mesa-api",
    port: env.PORT,
    timestamp: new Date().toISOString(),
  }));

  await app.register(eventController, { prefix: `${routePrefix}/events` });
  await app.register(recommendationsController, { prefix: routePrefix });
  await app.register(profileController, { prefix: routePrefix });
}

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

  // Rotas da API em caminhos diretos e sob /api para simplificar ingress e dev local.
  await registerApiRoutes(app);
  await registerApiRoutes(app, "/api");

  if (hasEmbeddedFrontend) {
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
        url.startsWith("/api/health") ||
        url.startsWith("/events") ||
        url.startsWith("/api/events") ||
        url.startsWith("/mesas/recomendadas") ||
        url.startsWith("/api/mesas/recomendadas") ||
        url.startsWith("/auth") ||
        url.startsWith("/api/auth") ||
        url.startsWith("/profiles") ||
        url.startsWith("/api/profiles")
      ) {
        return reply.callNotFound();
      }

      return reply.sendFile("index.html");
    });
  }

  return app;
}
