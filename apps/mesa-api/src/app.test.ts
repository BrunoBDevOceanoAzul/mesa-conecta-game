import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_URL ??= "postgresql://mesa:mesa@localhost:5432/mesa_test";

test("GET /health returns the mesa API health payload", async () => {
  const { buildApp } = await import("./app.js");
  const app = await buildApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    assert.equal(response.statusCode, 200);
    const json = response.json();
    assert.equal(json.status, "ok");
    assert.equal(json.service, "mesa-api");
  } finally {
    await app.close();
  }
});
