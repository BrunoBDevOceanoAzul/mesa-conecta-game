import { FastifyInstance } from "fastify";
import { z } from "zod";
import { DrizzlePostRepository } from "./drizzle-post.repository.js";

const createPostBodySchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image", "video", "mesa_share", "review_share", "event", "announcement"]).default("text"),
  mesaId: z.string().uuid().optional(),
  mediaUrls: z.array(z.string().url()).max(5).optional(),
  isPublic: z.boolean().default(true),
});

export async function postController(fastify: FastifyInstance) {
  const repository = new DrizzlePostRepository();

  // POST /posts — Criar post
  fastify.post("/posts", async (request, reply) => {
    const body = createPostBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "Invalid request body", details: body.error.flatten() });
    }

    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    try {
      const post = await repository.create({ ...body.data, userId: user.id });
      return reply.status(201).send({ ok: true, data: post.toJSON() });
    } catch (err) {
      fastify.log.error({ err }, "Failed to create post");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /posts — Feed público
  fastify.get("/posts", async (request, reply) => {
    const { limit = "20", offset = "0" } = request.query as Record<string, string>;
    try {
      const result = await repository.listFeed({
        limit: Math.min(Number(limit), 50),
        offset: Number(offset),
      });
      return reply.send({ ok: true, data: result.posts.map((p) => p.toJSON()), meta: { total: result.total, limit: Number(limit), offset: Number(offset) } });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list posts");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /posts/:id — Detalhe do post
  fastify.get("/posts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const post = await repository.findById(id);
      if (!post) {
        return reply.status(404).send({ ok: false, error: "Post not found" });
      }
      return reply.send({ ok: true, data: post.toJSON() });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get post");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // DELETE /posts/:id — Deletar post
  fastify.delete("/posts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    if (!user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    try {
      const deleted = await repository.delete(id, user.id);
      if (!deleted) {
        return reply.status(404).send({ ok: false, error: "Post not found or not authorized" });
      }
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error({ err }, "Failed to delete post");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
