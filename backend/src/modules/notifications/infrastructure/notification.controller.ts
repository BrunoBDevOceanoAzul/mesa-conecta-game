import { FastifyInstance } from "fastify";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { notifications } from "../../../db/schema/social.js";

export async function notificationController(fastify: FastifyInstance) {
  // GET /notifications — Minhas notificações
  fastify.get("/notifications", async (request, reply) => {
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });
    const { limit = "20", offset = "0", unreadOnly = "false" } = request.query as Record<string, string>;

    try {
      const where = unreadOnly === "true"
        ? and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
        : eq(notifications.userId, user.id);

      const items = await db.query.notifications.findMany({
        where,
        orderBy: [desc(notifications.createdAt)],
        limit: Math.min(Number(limit), 50),
        offset: Number(offset),
        with: { actor: true },
      });

      const [count] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(where);
      const [unreadCount] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(
        and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
      );

      return reply.send({
        ok: true,
        data: items,
        meta: { total: count?.count ?? 0, unread: unreadCount?.count ?? 0, limit: Number(limit), offset: Number(offset) },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list notifications");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // PATCH /notifications/:id/read — Marcar como lida
  fastify.patch("/notifications/:id/read", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      const [row] = await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
        .returning();

      if (!row) return reply.status(404).send({ ok: false, error: "Notification not found" });
      return reply.send({ ok: true, data: row });
    } catch (err) {
      fastify.log.error({ err }, "Failed to mark notification as read");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // PATCH /notifications/read-all — Marcar todas como lidas
  fastify.patch("/notifications/read-all", async (request, reply) => {
    const user = request.user;
    if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });

    try {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error({ err }, "Failed to mark all notifications as read");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
