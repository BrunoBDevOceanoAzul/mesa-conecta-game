-- Fix: Add missing columns and types to existing social tables

DO $$ BEGIN
  CREATE TYPE "post_type" AS ENUM (
    'text', 'image', 'video', 'mesa_share', 'review_share', 'event', 'announcement'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM (
    'booking_confirmed', 'booking_canceled', 'payment_received', 'payment_overdue',
    'new_follower', 'new_like', 'new_comment', 'mention', 'mesa_reminder', 'system'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "mesa_id" uuid REFERENCES mesas(id) ON DELETE set null;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "type" "post_type" DEFAULT 'text';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "media_urls" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "metadata_json" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comment_count" integer DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- If content was not nullable before, make it not null after ensuring data exists
UPDATE "posts" SET "content" = '' WHERE "content" IS NULL;
ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL;

-- Comments table
CREATE TABLE IF NOT EXISTS "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid REFERENCES posts(id) ON DELETE cascade NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE cascade NOT NULL,
  "content" text NOT NULL,
  "like_count" integer DEFAULT 0,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_comments_post_id" ON "comments" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_comments_user_id" ON "comments" ("user_id");
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE cascade NOT NULL,
  "type" "notification_type" NOT NULL,
  "title" text,
  "body" text,
  "data_json" jsonb DEFAULT '{}'::jsonb,
  "actor_user_id" uuid REFERENCES auth.users(id) ON DELETE set null,
  "is_read" boolean DEFAULT false,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("is_read") WHERE "is_read" = false;
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at");

-- Notifications table fix
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" "notification_type";
UPDATE "notifications" SET "type" = 'system' WHERE "type" IS NULL;
ALTER TABLE "notifications" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data_json" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actor_user_id" uuid REFERENCES auth.users(id) ON DELETE set null;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
