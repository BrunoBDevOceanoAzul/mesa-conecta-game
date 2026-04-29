import { describe, it, expect } from "./test/node-test-compat.js";

process.env.DATABASE_URL ??= "postgresql://mesa:mesa@localhost:5432/mesa_test";

describe("App Health", () => {
  it("GET /health returns the mesa API health payload", async () => {
    const { buildApp } = await import("./app.js");
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.status).toBe("ok");
      expect(json.service).toBe("mesa-api");
    } finally {
      await app.close();
    }
  });

  it("GET /api/health returns the mesa API health payload", async () => {
    const { buildApp } = await import("./app.js");
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/health",
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.status).toBe("ok");
      expect(json.service).toBe("mesa-api");
    } finally {
      await app.close();
    }
  });
});
