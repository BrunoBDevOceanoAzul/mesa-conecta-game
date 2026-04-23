import { buildApp } from "./app.js";
import { env } from "./lib/env.js";

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

void start();
