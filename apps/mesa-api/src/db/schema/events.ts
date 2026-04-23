import { sql } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";
import { mesas } from "./mesas.js";

export const eventTypeEnum = pgEnum("event_type", [
  "page_view",
  "mesa_click",
  "mesa_favorite",
  "mesa_share",
  "booking_initiated",
  "booking_confirmed",
  "booking_cancelled",
  "review_submitted",
  "search_query",
  "filter_applied",
  "profile_view",
  "gm_follow",
  "checkout_started",
  "payment_completed",
]);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: eventTypeEnum("event_type").notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  mesaId: uuid("mesa_id").references(() => mesas.id, { onDelete: "cascade" }),
  gmId: uuid("gm_id").references(() => authUsers.id, { onDelete: "set null" }),
  payload: jsonb("payload").default(sql`'{}'::jsonb`),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  source: text("source"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
