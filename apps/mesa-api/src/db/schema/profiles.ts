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
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";

export const appRole = pgEnum("app_role", ["admin", "moderator", "user", "advisor"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name"),
    displayName: text("display_name"),
    email: text("email"),
    role: text("role"),
    slug: text("slug"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    coverImageUrl: text("cover_image_url"),
    city: text("city"),
    state: text("state"),
    country: text("country").default("BR"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    instagramHandle: text("instagram_handle"),
    instagramUrl: text("instagram_url"),
    websiteUrl: text("website_url"),
    authProvider: text("auth_provider").default("email"),
    isActive: boolean("is_active").default(true),
    isPublic: boolean("is_public").default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    termsVersion: text("terms_version"),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingStep: integer("onboarding_step").default(0),
    canPlay: boolean("can_play").notNull().default(true),
    canGm: boolean("can_gm").notNull().default(false),
    canManageStore: boolean("can_manage_store").notNull().default(false),
    canManageBrand: boolean("can_manage_brand").notNull().default(false),
    preferredSystems: text("preferred_systems").array().default(sql`'{}'::text[]`),
    playStyles: text("play_styles").array().default(sql`'{}'::text[]`),
    experienceLevel: text("experience_level"),
    preferredFormat: text("preferred_format"),
    budgetRange: text("budget_range"),
    availabilityDays: text("availability_days").array().default(sql`'{}'::text[]`),
    availabilityTimes: text("availability_times").array().default(sql`'{}'::text[]`),
    themesLiked: text("themes_liked").array().default(sql`'{}'::text[]`),
    themesAvoided: text("themes_avoided").array().default(sql`'{}'::text[]`),
    avoidedNotes: text("avoided_notes"),
    sessionFormatPref: text("session_format_pref"),
    narrativeStyles: text("narrative_styles").array().default(sql`'{}'::text[]`),
    yearsMastering: text("years_mastering"),
    maxPlayers: integer("max_players"),
    targetAudience: text("target_audience"),
    mesaFormats: text("mesa_formats").array().default(sql`'{}'::text[]`),
    specialServices: text("special_services").array().default(sql`'{}'::text[]`),
    badges: text("badges").array().default(sql`'{}'::text[]`),
    badgeSummaryText: text("badge_summary_text"),
    currentTitle: text("current_title"),
    preferencesSummary: text("preferences_summary"),
    brandCategory: text("brand_category"),
    brandObjective: text("brand_objective"),
    brandAudience: text("brand_audience").array().default(sql`'{}'::text[]`),
    brandBudget: text("brand_budget"),
    ghostMode: boolean("ghost_mode").default(false),
    privacySettings: jsonb("privacy_settings").default(sql`'{"network": true, "hives": true, "market": true, "academy": true, "playground": true, "radar": true}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: unique("profiles_user_id_key").on(table.userId),
    slugUnique: uniqueIndex("idx_profiles_slug").on(table.slug).where(sql`${table.slug} IS NOT NULL`),
  }),
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: appRole("role").notNull(),
  },
  (table) => ({
    userRoleUnique: unique("user_roles_user_id_role_key").on(table.userId, table.role),
  }),
);

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash"),
  authProvider: text("auth_provider"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  browser: text("browser"),
  os: text("os"),
  deviceType: text("device_type"),
  city: text("city"),
  country: text("country"),
  isActive: boolean("is_active").notNull().default(true),
  signedInAt: timestamp("signed_in_at", { withTimezone: true }).notNull().defaultNow(),
  signedOutAt: timestamp("signed_out_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const onboardingSessions = pgTable("onboarding_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  currentStep: integer("current_step").default(0),
  progressPercent: integer("progress_percent").default(0),
  answersJson: jsonb("answers_json").default(sql`'{}'::jsonb`),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerProfiles = pgTable(
  "player_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    experienceLevel: text("experience_level"),
    budgetMin: numeric("budget_min").default("0"),
    budgetMax: numeric("budget_max").default("0"),
    formatPreference: text("format_preference").default("mixed"),
    prefersOneShot: boolean("prefers_one_shot").default(false),
    prefersCampaign: boolean("prefers_campaign").default(false),
    availabilityJson: jsonb("availability_json").default(sql`'[]'::jsonb`),
    preferredSystemsJson: jsonb("preferred_systems_json").default(sql`'[]'::jsonb`),
    preferredStylesJson: jsonb("preferred_styles_json").default(sql`'[]'::jsonb`),
    themesLikeJson: jsonb("themes_like_json").default(sql`'[]'::jsonb`),
    themesAvoidJson: jsonb("themes_avoid_json").default(sql`'[]'::jsonb`),
    reservationLimitPerCycle: integer("reservation_limit_per_cycle"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: unique("player_profiles_user_id_key").on(table.userId),
  }),
);

export const gmProfiles = pgTable(
  "gm_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    narrativeStyleJson: jsonb("narrative_style_json").default(sql`'[]'::jsonb`),
    systemsMasteredJson: jsonb("systems_mastered_json").default(sql`'[]'::jsonb`),
    priceMin: numeric("price_min").default("0"),
    priceMax: numeric("price_max").default("0"),
    maxPlayersDefault: integer("max_players_default").default(5),
    beginnerFriendly: boolean("beginner_friendly").default(true),
    supportsCorporate: boolean("supports_corporate").default(false),
    supportsTherapeutic: boolean("supports_therapeutic").default(false),
    supportsEducational: boolean("supports_educational").default(false),
    acceptedFormatsJson: jsonb("accepted_formats_json").default(sql`'[]'::jsonb`),
    availabilityJson: jsonb("availability_json").default(sql`'[]'::jsonb`),
    reputationScore: numeric("reputation_score").default("0"),
    averageRating: numeric("average_rating").default("0"),
    totalReviews: integer("total_reviews").default(0),
    totalTables: integer("total_tables").default(0),
    totalBookings: integer("total_bookings").default(0),
    occupancyRate: numeric("occupancy_rate").default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: unique("gm_profiles_user_id_key").on(table.userId),
  }),
);

export const storeProfiles = pgTable(
  "store_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    venueName: text("venue_name"),
    legalName: text("legal_name"),
    documentNumber: text("document_number"),
    addressLine: text("address_line"),
    addressNumber: text("address_number"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    capacityTotal: integer("capacity_total"),
    simultaneousTables: integer("simultaneous_tables"),
    averageTicket: numeric("average_ticket"),
    operationDaysJson: jsonb("operation_days_json").default(sql`'[]'::jsonb`),
    gamesCatalogJson: jsonb("games_catalog_json").default(sql`'[]'::jsonb`),
    structureFeaturesJson: jsonb("structure_features_json").default(sql`'[]'::jsonb`),
    averageRating: numeric("average_rating"),
    totalReviews: integer("total_reviews"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: unique("store_profiles_user_id_key").on(table.userId),
  }),
);

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    category: text("category"),
    monthlyBudget: numeric("monthly_budget"),
    targetAudienceJson: jsonb("target_audience_json").default(sql`'[]'::jsonb`),
    campaignGoal: text("campaign_goal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: unique("brand_profiles_user_id_key").on(table.userId),
  }),
);

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  authUser: one(authUsers, {
    fields: [profiles.userId],
    references: [authUsers.id],
  }),
  roles: many(userRoles),
  sessions: many(userSessions),
  onboardingSessions: many(onboardingSessions),
  playerProfile: one(playerProfiles),
  gmProfile: one(gmProfiles),
  storeProfile: one(storeProfiles),
  brandProfile: one(brandProfiles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [userRoles.userId],
    references: [authUsers.id],
  }),
  profile: one(profiles, {
    fields: [userRoles.userId],
    references: [profiles.userId],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [userSessions.userId],
    references: [authUsers.id],
  }),
  profile: one(profiles, {
    fields: [userSessions.userId],
    references: [profiles.userId],
  }),
}));

export const onboardingSessionsRelations = relations(onboardingSessions, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [onboardingSessions.userId],
    references: [authUsers.id],
  }),
  profile: one(profiles, {
    fields: [onboardingSessions.userId],
    references: [profiles.userId],
  }),
}));

export const playerProfilesRelations = relations(playerProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [playerProfiles.userId],
    references: [profiles.userId],
  }),
}));

export const gmProfilesRelations = relations(gmProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [gmProfiles.userId],
    references: [profiles.userId],
  }),
}));

export const storeProfilesRelations = relations(storeProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [storeProfiles.userId],
    references: [profiles.userId],
  }),
}));

export const brandProfilesRelations = relations(brandProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [brandProfiles.userId],
    references: [profiles.userId],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type NewOnboardingSession = typeof onboardingSessions.$inferInsert;
