import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";
import { mesas } from "./mesas.js";

// ============================================================
// POSTS
// ============================================================

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
  "rejected",
]);

export const postTypeEnum = pgEnum("post_type", [
  "organic",
  "sponsored",
  "announcement",
  "event",
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  role: text("role"),
  postType: postTypeEnum("post_type").default("organic"),
  title: text("title"),
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  status: postStatusEnum("status").default("draft"),
  sponsoredLabel: text("sponsored_label"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// COMMENTS
// ============================================================

export const commentStatusEnum = pgEnum("comment_status", [
  "published",
  "pending",
  "rejected",
  "hidden",
]);

export const postComments = pgTable("post_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorUserId: uuid("author_user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  parentCommentId: uuid("parent_comment_id"),
  content: text("content").notNull(),
  status: commentStatusEnum("status").default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// LIKES
// ============================================================

export const postLikes = pgTable("post_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// FAVORITES
// ============================================================

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  mesaId: uuid("mesa_id").references(() => mesas.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
