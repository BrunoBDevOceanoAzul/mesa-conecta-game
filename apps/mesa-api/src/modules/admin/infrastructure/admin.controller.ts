import { FastifyInstance } from "fastify";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { authUsers } from "../../../db/schema/auth.js";
import { mesas } from "../../../db/schema/mesas.js";
import { bookings } from "../../../db/schema/bookings.js";
import { posts } from "../../../db/schema/social.js";

function requireAdmin(request: any, reply: any) {
  const user = request.user;
  if (!user?.id) {
    return reply.status(401).send({ ok: false, error: "Unauthorized" });
  }
  if (user.role !== "admin") {
    return reply.status(403).send({ ok: false, error: "Admin access required" });
  }
}

export async function adminController(fastify: FastifyInstance) {
  // GET /admin/stats — Estatísticas operacionais
  fastify.get("/admin/stats", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(authUsers);
      const [mesasCount] = await db.select({ count: sql<number>`count(*)` }).from(mesas);
      const [bookingsCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
      const [postsCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);

      const [openMesas] = await db.select({ count: sql<number>`count(*)` }).from(mesas).where(eq(mesas.status, "aberta"));
      const [confirmedBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "confirmed"));
      const [pendingBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "pending"));

      return reply.send({
        ok: true,
        data: {
          users: usersCount?.count ?? 0,
          mesas: mesasCount?.count ?? 0,
          bookings: bookingsCount?.count ?? 0,
          posts: postsCount?.count ?? 0,
          openMesas: openMesas?.count ?? 0,
          confirmedBookings: confirmedBookings?.count ?? 0,
          pendingBookings: pendingBookings?.count ?? 0,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get admin stats");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /admin/users — Listar usuários
  fastify.get("/admin/users", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    const { limit = "50", offset = "0" } = request.query as Record<string, string>;

    try {
      const items = await db.select({
        id: authUsers.id,
        email: authUsers.email,
        createdAt: authUsers.createdAt,
        lastSignInAt: authUsers.lastSignInAt,
      }).from(authUsers).orderBy(desc(authUsers.createdAt)).limit(Number(limit)).offset(Number(offset));

      const [count] = await db.select({ count: sql<number>`count(*)` }).from(authUsers);

      return reply.send({
        ok: true,
        data: items,
        meta: { total: count?.count ?? 0, limit: Number(limit), offset: Number(offset) },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list users");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /admin/mesas — Listar todas as mesas
  fastify.get("/admin/mesas", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    const { limit = "50", offset = "0" } = request.query as Record<string, string>;

    try {
      const items = await db.select().from(mesas).orderBy(desc(mesas.createdAt)).limit(Number(limit)).offset(Number(offset));
      const [count] = await db.select({ count: sql<number>`count(*)` }).from(mesas);

      return reply.send({
        ok: true,
        data: items,
        meta: { total: count?.count ?? 0, limit: Number(limit), offset: Number(offset) },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list mesas");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /admin/bookings — Listar todas as reservas
  fastify.get("/admin/bookings", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    const { limit = "50", offset = "0" } = request.query as Record<string, string>;

    try {
      const items = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(Number(limit)).offset(Number(offset));
      const [count] = await db.select({ count: sql<number>`count(*)` }).from(bookings);

      return reply.send({
        ok: true,
        data: items,
        meta: { total: count?.count ?? 0, limit: Number(limit), offset: Number(offset) },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list bookings");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
