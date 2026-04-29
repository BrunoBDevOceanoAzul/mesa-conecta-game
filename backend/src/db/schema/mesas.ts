import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";

// Alinhado com o banco remoto Supabase (migrations)
export const mesaStatusEnum = pgEnum("mesa_status", [
  "aberta",
  "lotada",
  "encerrada",
  "cancelada",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "oneshot",
  "campanha",
  "aventura",
  "modulo",
]);

export const mesaFormatEnum = pgEnum("mesa_format", [
  "presencial",
  "online",
  "hibrido",
]);

export const mesas = pgTable(
  "mesas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    system: text("system").notNull(),
    format: mesaFormatEnum("format").notNull().default("presencial"),
    sessionType: sessionTypeEnum("session_type").notNull().default("oneshot"),
    mesaType: text("mesa_type").default("rpg"),
    status: mesaStatusEnum("status").notNull().default("aberta"),

    gmId: uuid("gm_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    gmName: text("gm_name").notNull(),

    storeId: uuid("store_id").references(() => authUsers.id, { onDelete: "set null" }),
    storeSlotId: uuid("store_slot_id"),
    boardGameId: uuid("board_game_id"),

    address: text("address"),
    city: text("city"),
    venue: text("venue"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),

    seatsTotal: integer("seats_total").notNull().default(5),
    seatsAvailable: integer("seats_available").notNull().default(5),

    minPrice: numeric("min_price"),
    maxPrice: numeric("max_price"),

    playStyles: text("play_styles").array().default(sql`'{}'::text[]`),
    tags: text("tags").array().default(sql`'{}'::text[]`),

    imageUrl: text("image_url"),
    coverImageUrl: text("cover_image_url"),
    organizerName: text("organizer_name"),

    stripePriceId: text("stripe_price_id"),
    stripeProductId: text("stripe_product_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: uniqueIndex("idx_mesas_status").on(table.status),
    gmIdIdx: uniqueIndex("idx_mesas_gm_id").on(table.gmId),
    cityIdx: uniqueIndex("idx_mesas_city").on(table.city),
    startAtIdx: uniqueIndex("idx_mesas_start_at").on(table.startAt),
  }),
);

export const mesaViews = pgTable("mesa_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  mesaId: uuid("mesa_id")
    .notNull()
    .references(() => mesas.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  ipHash: text("ip_hash"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  source: text("source"),
  deviceType: text("device_type"),
});

export const mesaPopularityScores = pgTable("mesa_popularity_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  mesaId: uuid("mesa_id")
    .notNull()
    .references(() => mesas.id, { onDelete: "cascade" }),
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  favoriteCount: integer("favorite_count").default(0),
  bookingCount: integer("booking_count").default(0),
  conversionRate: numeric("conversion_rate").default("0"),
  popularityScore: numeric("popularity_score").default("0"),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mesaBoosts = pgTable("mesa_boosts", {
  id: uuid("id").defaultRandom().primaryKey(),
  mesaId: uuid("mesa_id")
    .notNull()
    .references(() => mesas.id, { onDelete: "cascade" }),
  boostScore: numeric("boost_score").default("0"),
  isActive: boolean("is_active").default(false),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// FAVORITES
// ============================================================

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mesaId: uuid("mesa_id")
      .notNull()
      .references(() => mesas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userMesaUnique: unique("idx_favorites_user_mesa").on(table.userId, table.mesaId),
  }),
);

export const mesasRelations = relations(mesas, ({ one, many }) => ({
  gm: one(authUsers, {
    fields: [mesas.gmId],
    references: [authUsers.id],
  }),
  views: many(mesaViews),
  popularityScores: many(mesaPopularityScores),
  boosts: many(mesaBoosts),
  favorites: many(favorites),
}));

export const mesaViewsRelations = relations(mesaViews, ({ one }) => ({
  mesa: one(mesas, {
    fields: [mesaViews.mesaId],
    references: [mesas.id],
  }),
}));

export const mesaPopularityScoresRelations = relations(mesaPopularityScores, ({ one }) => ({
  mesa: one(mesas, {
    fields: [mesaPopularityScores.mesaId],
    references: [mesas.id],
  }),
}));

export const mesaBoostsRelations = relations(mesaBoosts, ({ one }) => ({
  mesa: one(mesas, {
    fields: [mesaBoosts.mesaId],
    references: [mesas.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  mesa: one(mesas, {
    fields: [favorites.mesaId],
    references: [mesas.id],
  }),
  user: one(authUsers, {
    fields: [favorites.userId],
    references: [authUsers.id],
  }),
}));

export type Mesa = typeof mesas.$inferSelect;
export type NewMesa = typeof mesas.$inferInsert;
export type MesaView = typeof mesaViews.$inferSelect;
export type MesaPopularityScore = typeof mesaPopularityScores.$inferSelect;
export type MesaBoost = typeof mesaBoosts.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
