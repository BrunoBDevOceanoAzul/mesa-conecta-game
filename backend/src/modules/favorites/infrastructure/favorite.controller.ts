import { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { favorites, mesaPopularityScores } from "../../../db/schema/mesas.js";

export async function favoriteController(fastify: FastifyInstance) {
  fastify.get("/favorites", async (request, reply) => {
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      const userFavorites = await db.query.favorites.findMany({
        where: eq(favorites.userId, user.id),
        with: {
          mesa: true,
        },
        orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
      });

      return reply.send({ ok: true, data: userFavorites });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list favorites");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  fastify.post("/favorites", async (request, reply) => {
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    const { mesaId } = request.body as { mesaId: string };
    if (!mesaId) {
      return reply.status(400).send({ ok: false, error: "mesaId is required" });
    }

    try {
      const existing = await db.query.favorites.findFirst({
        where: and(eq(favorites.mesaId, mesaId), eq(favorites.userId, user.id)),
      });

      if (existing) {
        return reply.send({ ok: true, data: existing, alreadyFavorited: true });
      }

      const [inserted] = await db
        .insert(favorites)
        .values({ mesaId, userId: user.id })
        .returning();

      await db
        .update(mesaPopularityScores)
        .set({ favoriteCount: sql`${mesaPopularityScores.favoriteCount} + 1` })
        .where(eq(mesaPopularityScores.mesaId, mesaId));

      return reply.status(201).send({ ok: true, data: inserted });
    } catch (err) {
      fastify.log.error({ err }, "Failed to add favorite");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  fastify.delete("/favorites/:id", async (request, reply) => {
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    const { id } = request.params as { id: string };

    try {
      const existing = await db.query.favorites.findFirst({
        where: and(eq(favorites.id, id), eq(favorites.userId, user.id)),
      });

      if (!existing) {
        return reply.status(404).send({ ok: false, error: "Favorite not found" });
      }

      await db.delete(favorites).where(eq(favorites.id, id));

      await db
        .update(mesaPopularityScores)
        .set({ favoriteCount: sql`GREATEST(0, ${mesaPopularityScores.favoriteCount} - 1)` })
        .where(eq(mesaPopularityScores.mesaId, existing.mesaId));

      return reply.send({ ok: true, removed: true });
    } catch (err) {
      fastify.log.error({ err }, "Failed to remove favorite");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
