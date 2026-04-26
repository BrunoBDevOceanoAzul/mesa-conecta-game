-- Migration: Create analytics and engagement tables
-- Tables: events, mesa_views, mesa_popularity_scores, mesa_boosts

-- ============================================================
-- Enum: event_type
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "event_type" AS ENUM (
    'page_view', 'mesa_click', 'mesa_favorite', 'mesa_share',
    'booking_initiated', 'booking_confirmed', 'booking_cancelled',
    'review_submitted', 'search_query', 'filter_applied',
    'profile_view', 'gm_follow', 'checkout_started', 'payment_completed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Table: events
-- Behavioral tracking for analytics and recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" "event_type" NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "mesa_id" uuid REFERENCES mesas(id) ON DELETE CASCADE,
  "gm_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "ip_hash" text,
  "user_agent" text,
  "source" text,
  "session_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- Table: mesa_views
-- Track page views for mesa popularity
-- ============================================================
CREATE TABLE IF NOT EXISTS "mesa_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mesa_id" uuid NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "ip_hash" text,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "source" text,
  "device_type" text
);

-- ============================================================
-- Table: mesa_popularity_scores
-- Pre-computed popularity metrics for recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS "mesa_popularity_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mesa_id" uuid NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  "view_count" integer DEFAULT 0,
  "click_count" integer DEFAULT 0,
  "favorite_count" integer DEFAULT 0,
  "booking_count" integer DEFAULT 0,
  "conversion_rate" numeric DEFAULT '0',
  "popularity_score" numeric DEFAULT '0',
  "calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- Table: mesa_boosts
-- Boost campaigns for mesa visibility
-- ============================================================
CREATE TABLE IF NOT EXISTS "mesa_boosts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mesa_id" uuid NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  "boost_score" numeric DEFAULT '0',
  "is_active" boolean DEFAULT false,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS "idx_events_user_id" ON "events" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_events_mesa_id" ON "events" ("mesa_id");
CREATE INDEX IF NOT EXISTS "idx_events_event_type" ON "events" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_events_created_at" ON "events" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_mesa_views_mesa_id" ON "mesa_views" ("mesa_id");
CREATE INDEX IF NOT EXISTS "idx_mesa_views_viewed_at" ON "mesa_views" ("viewed_at");

CREATE INDEX IF NOT EXISTS "idx_mesa_popularity_mesa_id" ON "mesa_popularity_scores" ("mesa_id");
CREATE INDEX IF NOT EXISTS "idx_mesa_popularity_score" ON "mesa_popularity_scores" ("popularity_score");

CREATE INDEX IF NOT EXISTS "idx_mesa_boosts_mesa_id" ON "mesa_boosts" ("mesa_id");
CREATE INDEX IF NOT EXISTS "idx_mesa_boosts_active" ON "mesa_boosts" ("is_active") WHERE "is_active" = true;
