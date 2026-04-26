import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";
import { mesas } from "./mesas.js";

export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "pending",
  "rejected",
  "hidden",
]);

export const reviewTypeEnum = pgEnum("review_type", [
  "gm",
  "store",
  "table",
]);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull(),
  reviewerUserId: uuid("reviewer_user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  reviewedUserId: uuid("reviewed_user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reviewType: reviewTypeEnum("review_type").default("gm"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedTableId: uuid("reviewed_table_id").references(() => mesas.id, { onDelete: "set null" }),
  reviewedStoreId: uuid("reviewed_store_id"),
  status: reviewStatusEnum("status").default("published"),
  isVerified: boolean("is_verified").default(true),
  subRatingsJson: jsonb("sub_ratings_json").default(sql`'{}'::jsonb`),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
