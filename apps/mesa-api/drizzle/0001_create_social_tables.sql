-- Migration: Create social tables
-- Tables: posts, comments, post_likes, comment_likes, notifications

-- ============================================================
-- Enum: post_type
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "post_type" AS ENUM (
    'text', 'image', 'video', 'mesa_share', 'review_share', 'event', 'announcement'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Enum: notification_type
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM (
    'booking_confirmed', 'booking_canceled', 'payment_received', 'payment_overdue',
    'new_follower', 'new_like', 'new_comment', 'mention', 'mesa_reminder', 'system'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Table: posts
-- ============================================================
CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE cascade NOT NULL,
  "mesa_id" uuid REFERENCES mesas(id) ON DELETE set null,
  "type" "post_type" DEFAULT 'text',
  "content" text NOT NULL,
  "media_urls" jsonb DEFAULT '[]'::jsonb,
  "metadata_json" jsonb DEFAULT '{}'::jsonb,
  "is_public" boolean DEFAULT true,
  "is_pinned" boolean DEFAULT false,
  "like_count" integer DEFAULT 0,
  "comment_count" integer DEFAULT 0,
  "share_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- Table: comments
-- ============================================================
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

-- ============================================================
-- Table: post_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS "post_likes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid REFERENCES posts(id) ON DELETE cascade NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE cascade NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE("post_id", "user_id")
);

-- ============================================================
-- Table: comment_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comment_id" uuid REFERENCES comments(id) ON DELETE cascade NOT NULL,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE cascade NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE("comment_id", "user_id")
);

-- ============================================================
-- Table: notifications
-- ============================================================
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

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS "idx_posts_user_id" ON "posts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_posts_mesa_id" ON "posts" ("mesa_id");
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "posts" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_posts_is_public" ON "posts" ("is_public") WHERE "is_public" = true;

CREATE INDEX IF NOT EXISTS "idx_comments_post_id" ON "comments" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_comments_user_id" ON "comments" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_post_likes_post_id" ON "post_likes" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_likes_user_id" ON "post_likes" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_comment_likes_comment_id" ON "comment_likes" ("comment_id");
CREATE INDEX IF NOT EXISTS "idx_comment_likes_user_id" ON "comment_likes" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("is_read") WHERE "is_read" = false;
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at");
