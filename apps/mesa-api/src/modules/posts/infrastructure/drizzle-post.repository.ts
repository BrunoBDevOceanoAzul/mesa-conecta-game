import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { posts } from "../../../db/schema/social.js";
import { Post, PostData, CreatePostInput, PostRepository } from "../domain/post.js";

export class DrizzlePostRepository implements PostRepository {
  async create(data: CreatePostInput): Promise<Post> {
    const [row] = await db.insert(posts).values({
      userId: data.userId,
      content: data.content,
      type: (data.type as any) ?? "text",
      mesaId: data.mesaId ?? null,
      mediaUrls: data.mediaUrls ?? [],
      isPublic: data.isPublic ?? true,
    }).returning();
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Post | null> {
    const row = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: { user: true, mesa: true },
    });
    return row ? this.toDomain(row as any) : null;
  }

  async listFeed(params: { limit: number; offset: number; userId?: string }): Promise<{ posts: Post[]; total: number }> {
    const where = params.userId
      ? and(eq(posts.userId, params.userId), eq(posts.isPublic, true))
      : eq(posts.isPublic, true);

    const items = await db.query.posts.findMany({
      where,
      orderBy: [desc(posts.isPinned), desc(posts.createdAt)],
      limit: params.limit,
      offset: params.offset,
      with: { user: true, mesa: true },
    });

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(where);

    return {
      posts: items.map((r) => this.toDomain(r as any)),
      total: count?.count ?? 0,
    };
  }

  async listByUser(userId: string, params: { limit: number; offset: number }): Promise<{ posts: Post[]; total: number }> {
    const where = and(eq(posts.userId, userId), eq(posts.isPublic, true));

    const items = await db.query.posts.findMany({
      where,
      orderBy: [desc(posts.createdAt)],
      limit: params.limit,
      offset: params.offset,
      with: { user: true, mesa: true },
    });

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(where);

    return {
      posts: items.map((r) => this.toDomain(r as any)),
      total: count?.count ?? 0,
    };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [row] = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return !!row;
  }

  private toDomain(row: any, currentUserId?: string): Post {
    const user = row.user;
    const mesa = row.mesa;

    return new Post({
      id: row.id,
      userId: row.userId,
      mesaId: row.mesaId ?? null,
      type: row.type,
      content: row.content,
      mediaUrls: (row.mediaUrls as string[]) ?? [],
      metadataJson: (row.metadataJson as Record<string, unknown>) ?? null,
      isPublic: row.isPublic ?? true,
      isPinned: row.isPinned ?? false,
      likeCount: row.likeCount ?? 0,
      commentCount: row.commentCount ?? 0,
      shareCount: row.shareCount ?? 0,
      author: user
        ? {
            name: user.rawUserMetaData?.name ?? user.rawUserMetaData?.full_name ?? null,
            avatarUrl: user.rawUserMetaData?.avatar_url ?? null,
            slug: user.rawUserMetaData?.slug ?? null,
            city: user.rawUserMetaData?.city ?? null,
            role: user.rawUserMetaData?.role ?? null,
          }
        : null,
      mesa: mesa
        ? {
            id: mesa.id,
            title: mesa.title,
            system: mesa.system,
            startAt: mesa.startAt ?? null,
            slug: mesa.slug ?? null,
          }
        : null,
      userLiked: false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
