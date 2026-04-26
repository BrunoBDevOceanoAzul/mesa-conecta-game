import { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { postLikes, commentLikes, posts } from "../../../db/schema/social.js";

export async function likeController(fastify: FastifyInstance) {
  // POST /posts/:postId/like — Toggle like em post
  fastify.post("/posts/:postId/like", async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      const existing = await db.query.postLikes.findFirst({
        where: and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)),
      });

      if (existing) {
        await db.delete(postLikes).where(eq(postLikes.id, existing.id));
        await db.update(posts).set({ likeCount: sql`GREATEST(0, ${posts.likeCount} - 1)` }).where(eq(posts.id, postId));
        return reply.send({ ok: true, liked: false });
      } else {
        await db.insert(postLikes).values({ postId, userId: user.id });
        await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, postId));
        return reply.send({ ok: true, liked: true });
      }
    } catch (err) {
      fastify.log.error({ err }, "Failed to toggle post like");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // POST /comments/:commentId/like — Toggle like em comentário
  fastify.post("/comments/:commentId/like", async (request, reply) => {
    const { commentId } = request.params as { commentId: string };
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      const existing = await db.query.commentLikes.findFirst({
        where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, user.id)),
      });

      if (existing) {
        await db.delete(commentLikes).where(eq(commentLikes.id, existing.id));
        return reply.send({ ok: true, liked: false });
      } else {
        await db.insert(commentLikes).values({ commentId, userId: user.id });
        return reply.send({ ok: true, liked: true });
      }
    } catch (err) {
      fastify.log.error({ err }, "Failed to toggle comment like");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
