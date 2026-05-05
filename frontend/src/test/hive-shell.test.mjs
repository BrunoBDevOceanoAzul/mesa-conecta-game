import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const readFrontend = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readRepo = (path) => readFileSync(join(repoRoot, path), "utf8");

describe("Hive shell integration", () => {
  it("uses Hive as the authenticated root while keeping isolated public flows direct", () => {
    const app = readFrontend("pages/_app.tsx");

    assert.match(app, /function AuthenticatedHiveRoot/);
    assert.match(app, /PUBLIC_ROUTE_PATTERNS/);
    assert.match(app, /AUTHENTICATED_ROUTE_REDIRECTS/);
    assert.match(app, /router\.replace\(nextHiveRoute\)/);
    assert.match(app, /"\/explorar": "\/hive\?f=market"/);
    assert.match(app, /"\/Billing": "\/hive\?f=market&overlay=billing"/);
  });

  it("keeps MarketContent inside Hive overlays instead of linking to legacy explorar routes", () => {
    const market = readFrontend("components/hive/sections/MarketContent.tsx");

    assert.doesNotMatch(market, /href=["']\/explorar["']/);
    assert.match(market, /openOverlay\('mesa'/);
  });

  it("accepts the Supabase publishable key under both GitHub environment names", () => {
    const client = readFrontend("integrations/supabase/client.ts");

    assert.match(client, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    assert.match(client, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("keeps CI/CD and registry references on GitHub Actions only", () => {
    const needle = "git" + "lab";
    let output = "";

    try {
      output = execFileSync(
        "rg",
        [
          "-i",
          "--files-with-matches",
          needle,
          "--glob",
          "!**/node_modules/**",
          "--glob",
          "!**/.next/**",
          "--glob",
          "!**/dist/**",
          "--glob",
          "!**/.git/**",
          "--glob",
          "!**/.git-rewrite/**",
          "--glob",
          "!**/package-lock.json",
        ],
        { cwd: repoRoot, encoding: "utf8" },
      );
    } catch (err) {
      if (err.status !== 1) throw err;
    }

    const offenders = output
      .split("\n")
      .filter(Boolean)
      .filter((file) => file !== "frontend/src/test/hive-shell.test.mjs");

    assert.deepEqual(offenders, []);
  });
});
