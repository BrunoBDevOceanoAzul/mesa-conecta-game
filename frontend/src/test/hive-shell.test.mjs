import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const readFrontend = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ignoredDirs = new Set([".git", ".git-rewrite", ".next", "dist", "node_modules"]);
const ignoredFiles = new Set(["package-lock.json"]);

function listTextFiles(dir, root = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);
    const relativePath = relative(root, absolutePath);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...listTextFiles(absolutePath, root));
      }
      continue;
    }

    if (!entry.isFile() || ignoredFiles.has(entry.name)) {
      continue;
    }

    if (statSync(absolutePath).size <= 1024 * 1024) {
      files.push(relativePath);
    }
  }

  return files;
}

describe("Hive shell integration", () => {
  it("uses Hive as the authenticated root while keeping isolated public flows direct", () => {
    const app = readFrontend("pages/_app.tsx");

    assert.match(app, /function AuthenticatedHiveRoot/);
    assert.match(app, /PUBLIC_ROUTE_PATTERNS/);
    assert.match(app, /AUTHENTICATED_ROUTE_REDIRECTS/);
    assert.match(app, /shouldRedirectToHive/);
    assert.match(app, /router\.replace\(nextHiveRoute\)/);
    assert.match(app, /"\/explorar": "\/hive\?f=market"/);
    assert.match(app, /"\/Billing": "\/hive\?f=market&overlay=billing"/);
    assert.doesNotMatch(app, /\/Hive/);
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

    const offenders = listTextFiles(repoRoot)
      .filter((file) => readFileSync(join(repoRoot, file), "utf8").toLowerCase().includes(needle))
      .filter((file) => file !== "AGENTS.md")
      .filter((file) => file !== "frontend/src/test/hive-shell.test.mjs");

    assert.deepEqual(offenders, []);
  });
});
