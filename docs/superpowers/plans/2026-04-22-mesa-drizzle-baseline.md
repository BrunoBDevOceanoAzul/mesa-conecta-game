# Mesa Drizzle Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the initial `mesa` API workspace and establish a Drizzle baseline that reflects the current remote Supabase database.

**Architecture:** Add a dedicated `apps/mesa-api` workspace with its own TypeScript and Drizzle configuration. Use Drizzle introspection against the existing remote Supabase Postgres instance to capture a baseline schema without changing application behavior yet.

**Tech Stack:** Node.js, TypeScript, Fastify, Drizzle ORM, drizzle-kit, pg, Zod

---

### Task 1: Scaffold `mesa` API workspace

**Files:**
- Create: `apps/mesa-api/package.json`
- Create: `apps/mesa-api/tsconfig.json`
- Create: `apps/mesa-api/src/app.ts`
- Create: `apps/mesa-api/src/server.ts`
- Create: `apps/mesa-api/src/lib/env.ts`
- Create: `apps/mesa-api/src/db/client.ts`
- Create: `apps/mesa-api/src/db/schema/.gitkeep`

- [ ] **Step 1: Create the workspace files**

Create the API workspace with the minimal runtime and development scripts required for local execution and future module growth.

- [ ] **Step 2: Install runtime dependencies**

Run: `NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm install --prefix apps/mesa-api fastify drizzle-orm pg zod dotenv`
Expected: install completes with exit code `0`

- [ ] **Step 3: Install development dependencies**

Run: `NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm install --prefix apps/mesa-api -D typescript tsx drizzle-kit @types/node`
Expected: install completes with exit code `0`

- [ ] **Step 4: Verify workspace scripts**

Run: `NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm --prefix apps/mesa-api exec tsc --noEmit`
Expected: TypeScript exits with code `0`

### Task 2: Add Drizzle baseline configuration

**Files:**
- Create: `apps/mesa-api/drizzle.config.ts`
- Create: `apps/mesa-api/.env.example`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add Drizzle config**

Point Drizzle at the `apps/mesa-api/src/db/schema` output directory and read `DATABASE_URL` from the API workspace environment.

- [ ] **Step 2: Add API env template**

Document the minimum variables needed for baseline work:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 3: Update continuity document**

Record that the API workspace and Drizzle baseline infrastructure were created and note the next checkpoint.

### Task 3: Introspect the current remote Supabase database

**Files:**
- Create or modify: `apps/mesa-api/src/db/schema/*`
- Create or modify: `apps/mesa-api/drizzle/meta/*`

- [ ] **Step 1: Prepare environment for introspection**

Run the introspection using the remote Supabase `DATABASE_URL` already configured locally.

- [ ] **Step 2: Run Drizzle introspection**

Run: `cd apps/mesa-api && NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npx drizzle-kit introspect`
Expected: schema files are generated under `src/db/schema` and Drizzle metadata is created

- [ ] **Step 3: Review the generated schema**

Confirm the baseline captures the existing database shape without introducing manual edits yet.

- [ ] **Step 4: Verify generated TypeScript compiles**

Run: `NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm --prefix apps/mesa-api exec tsc --noEmit`
Expected: TypeScript exits with code `0`

### Task 4: Add baseline usage notes

**Files:**
- Create: `apps/mesa-api/README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Document how the baseline was created**

Explain the source of truth, how to rerun introspection, and the rule that future schema changes should move from introspection to reviewed migrations.

- [ ] **Step 2: Record next implementation checkpoint**

Note that the next engineering step is to curate the introspected schema by domain and start `auth/profiles`.

