import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { comments } from "../../../db/schema/social.js";

const createCommentBodySchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
});

export async function commentController(fastify: FastifyInstance) {
  // POST /posts/:postId/comments — Criar comentário
  fastify.post("/posts/:postId/comments", async (request, reply) => {
    const body = createCommentBodySchema.safeParse(request.body);
    const { postId } = request.params as { postId: string };
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });
    if (!body.success) return reply.status(400).send({ ok: false, error: "Invalid request body", details: body.error.flatten() });

    try {
      const [row] = await db.insert(comments).values({
        postId,
        userId: user.id,
        content: body.data.content,
      }).returning();

      return reply.status(201).send({ ok: true, data: row });
    } catch (err) {
      fastify.log.error({ err }, "Failed to create comment");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /posts/:postId/comments — Listar comentários
  fastify.get("/posts/:postId/comments", async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const { limit = "20", offset = "0" } = request.query as Record<string, string>;

    try {
      const items = await db.query.comments.findMany({
        where: eq(comments.postId, postId),
        orderBy: [desc(comments.createdAt)],
        limit: Math.min(Number(limit), 50),
        offset: Number(offset),
        with: { user: true },
      });

      const [count] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, postId));

      return reply.send({ ok: true, data: items, meta: { total: count?.count ?? 0, limit: Number(limit), offset: Number(offset) } });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list comments");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // DELETE /comments/:id
  fastify.delete("/comments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      const [row] = await db.delete(comments).where(and(eq(comments.id, id), eq(comments.userId, user.id))).returning();
      if (!row) return reply.status(404).send({ ok: false, error: "Comment not found or not authorized" });
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error({ err }, "Failed to delete comment");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
