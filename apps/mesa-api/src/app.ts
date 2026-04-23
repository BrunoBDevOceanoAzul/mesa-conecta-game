import Fastify from "fastify";

import { env } from "./lib/env.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "mesa-api",
    port: env.PORT,
  }));

  return app;
}
