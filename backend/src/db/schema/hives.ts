import { pgTable, uuid, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { authUsers } from "./auth.js";

export const hives = pgTable("hives", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  avatarUrl: text("avatar_url"),
  isPublic: boolean("is_public").default(true),
  settings: jsonb("settings").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const hiveMembers = pgTable("hive_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  hiveId: uuid("hive_id")
    .notNull()
    .references(() => hives.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // 'member', 'moderator', 'owner'
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
});

export const hivesRelations = relations(hives, ({ many, one }) => ({
  owner: one(authUsers, {
    fields: [hives.ownerId],
    references: [authUsers.id],
  }),
  members: many(hiveMembers),
}));

export const hiveMembersRelations = relations(hiveMembers, ({ one }) => ({
  hive: one(hives, {
    fields: [hiveMembers.hiveId],
    references: [hives.id],
  }),
  user: one(authUsers, {
    fields: [hiveMembers.userId],
    references: [authUsers.id],
  }),
}));

export type Hive = typeof hives.$inferSelect;
export type NewHive = typeof hives.$inferInsert;
export type HiveMember = typeof hiveMembers.$inferSelect;
export type NewHiveMember = typeof hiveMembers.$inferInsert;
