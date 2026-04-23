import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";
import { env } from "../lib/env.js";

const client = postgres(env.DATABASE_URL, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
export { client };
export type Database = typeof db;
