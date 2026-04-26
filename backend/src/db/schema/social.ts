import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
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

// ============================================================
// POSTS
// ============================================================

export const postTypeEnum = pgEnum("post_type", [
  "text",
  "image",
  "video",
  "mesa_share",
  "review_share",
  "event",
  "announcement",
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  mesaId: uuid("mesa_id").references(() => mesas.id, { onDelete: "set null" }),
  type: postTypeEnum("type").default("text"),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default(sql`'[]'::jsonb`),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`),
  isPublic: boolean("is_public").default(true),
  isPinned: boolean("is_pinned").default(false),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// COMMENTS
// ============================================================

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  likeCount: integer("like_count").default(0),
  isDeleted: boolean("is_deleted").default(false),
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

export const commentLikes = pgTable("comment_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// RELATIONS (definidas após todas as tabelas para evitar circularidade)
// ============================================================

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(authUsers, { fields: [posts.userId], references: [authUsers.id] }),
  mesa: one(mesas, { fields: [posts.mesaId], references: [mesas.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(authUsers, { fields: [comments.userId], references: [authUsers.id] }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(authUsers, { fields: [postLikes.userId], references: [authUsers.id] }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, { fields: [commentLikes.commentId], references: [comments.id] }),
  user: one(authUsers, { fields: [commentLikes.userId], references: [authUsers.id] }),
}));

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "booking_confirmed",
  "booking_canceled",
  "payment_received",
  "payment_overdue",
  "new_follower",
  "new_like",
  "new_comment",
  "mention",
  "mesa_reminder",
  "system",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title"),
  body: text("body"),
  dataJson: jsonb("data_json").default(sql`'{}'::jsonb`),
  actorUserId: uuid("actor_user_id").references(() => authUsers.id, { onDelete: "set null" }),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(authUsers, { fields: [notifications.userId], references: [authUsers.id] }),
  actor: one(authUsers, { fields: [notifications.actorUserId], references: [authUsers.id] }),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
