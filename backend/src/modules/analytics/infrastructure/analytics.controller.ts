import { FastifyInstance } from "fastify";
import { eq, desc, sql, gte, and } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { authUsers } from "../../../db/schema/auth.js";
import { mesas } from "../../../db/schema/mesas.js";
import { bookings } from "../../../db/schema/bookings.js";
import { posts, postLikes, comments } from "../../../db/schema/social.js";
import { payments } from "../../../db/schema/billing.js";
import { events } from "../../../db/schema/events.js";
import { mesaViews } from "../../../db/schema/mesas.js";

function requireAdmin(request: any, reply: any) {
  const user = request.user;
  if (!user?.id) return reply.status(401).send({ ok: false, error: "Unauthorized" });
  if (user.role !== "admin") return reply.status(403).send({ ok: false, error: "Admin access required" });
}

function getDateRange(days: number) {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start;
}

export async function analyticsController(fastify: FastifyInstance) {
  // GET /analytics/overview — KPIs gerais
  fastify.get("/analytics/overview", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(authUsers);
      const [newUsers7d] = await db.select({ count: sql<number>`count(*)` }).from(authUsers).where(gte(authUsers.createdAt, getDateRange(7)));
      const [mesasCount] = await db.select({ count: sql<number>`count(*)` }).from(mesas);
      const [openMesas] = await db.select({ count: sql<number>`count(*)` }).from(mesas).where(eq(mesas.status, "aberta"));
      const [bookingsCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
      const [confirmedBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "confirmed"));
      const [bookings7d] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(gte(bookings.createdAt, getDateRange(7)));
      const [postsCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);
      const [likesCount] = await db.select({ count: sql<number>`count(*)` }).from(postLikes);
      const [views7d] = await db.select({ count: sql<number>`count(*)` }).from(mesaViews).where(gte(mesaViews.viewedAt, getDateRange(7)));

      return reply.send({
        ok: true,
        data: {
          users: { total: usersCount?.count ?? 0, newLast7d: newUsers7d?.count ?? 0 },
          mesas: { total: mesasCount?.count ?? 0, open: openMesas?.count ?? 0 },
          bookings: { total: bookingsCount?.count ?? 0, confirmed: confirmedBookings?.count ?? 0, last7d: bookings7d?.count ?? 0 },
          engagement: { posts: postsCount?.count ?? 0, likes: likesCount?.count ?? 0, viewsLast7d: views7d?.count ?? 0 },
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get analytics overview");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/mesas — Métricas de mesas por sistema, status, mês
  fastify.get("/analytics/mesas", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      // Por status
      const byStatus = await db.select({
        status: mesas.status,
        count: sql<number>`count(*)`,
      }).from(mesas).groupBy(mesas.status);

      // Por sistema (top 10)
      const bySystem = await db.select({
        system: mesas.system,
        count: sql<number>`count(*)`,
      }).from(mesas).groupBy(mesas.system).orderBy(desc(sql`count(*)`)).limit(10);

      // Por mês (últimos 6 meses)
      const byMonth = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', start_at) as month,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'aberta' THEN 1 ELSE 0 END) as open_count
        FROM mesas
        WHERE start_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', start_at)
        ORDER BY month DESC
      `);

      return reply.send({
        ok: true,
        data: { byStatus, bySystem, byMonth: [...byMonth] },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get mesas analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/users — Métricas de usuários
  fastify.get("/analytics/users", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      // Novos usuários por mês
      const newByMonth = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM auth.users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      // Usuários ativos por mês (tiveram booking ou post)
      const activeByMonth = await db.execute(sql`
        WITH active_users AS (
          SELECT DISTINCT player_user_id as user_id, DATE_TRUNC('month', created_at) as month
          FROM bookings
          WHERE created_at >= NOW() - INTERVAL '6 months'
          UNION
          SELECT DISTINCT user_id, DATE_TRUNC('month', created_at) as month
          FROM posts
          WHERE created_at >= NOW() - INTERVAL '6 months'
        )
        SELECT month, COUNT(DISTINCT user_id) as count
        FROM active_users
        GROUP BY month
        ORDER BY month DESC
      `);

      return reply.send({
        ok: true,
        data: { newByMonth: [...newByMonth], activeByMonth: [...activeByMonth] },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get users analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/revenue — Métricas de receita
  fastify.get("/analytics/revenue", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      const byMonth = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as bookings_count,
          SUM(amount::numeric) as total_amount,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      return reply.send({
        ok: true,
        data: { byMonth: [...byMonth] },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get revenue analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/engagement — Métricas de engajamento
  fastify.get("/analytics/engagement", async (request, reply) => {
    const check = requireAdmin(request, reply);
    if (check) return check;

    try {
      const byMonth = await db.execute(sql`
        WITH monthly_stats AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) FILTER (WHERE TRUE) as posts,
            COUNT(*) FILTER (WHERE TRUE) as comments
          FROM posts
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
        )
        SELECT 
          m.month,
          COALESCE(m.posts, 0) as posts,
          COALESCE(c.comments, 0) as comments,
          COALESCE(l.likes, 0) as likes
        FROM monthly_stats m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as comments
          FROM comments
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
        ) c ON m.month = c.month
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as likes
          FROM post_likes
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
        ) l ON m.month = l.month
        ORDER BY m.month DESC
      `);

      return reply.send({
        ok: true,
        data: { byMonth: [...byMonth] },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get engagement analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/mesa/:id — Métricas de uma mesa específica
  fastify.get("/analytics/mesa/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const [views] = await db.select({ count: sql<number>`count(*)` }).from(mesaViews).where(eq(mesaViews.mesaId, id));
      const [bookingsCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.gameTableId, id));
      const [eventsCount] = await db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.mesaId, id));

      return reply.send({
        ok: true,
        data: {
          mesaId: id,
          views: views?.count ?? 0,
          bookings: bookingsCount?.count ?? 0,
          events: eventsCount?.count ?? 0,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get mesa analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /analytics/gm/:id — Métricas de um GM
  fastify.get("/analytics/gm/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const [mesasCount] = await db.select({ count: sql<number>`count(*)` }).from(mesas).where(eq(mesas.gmId, id));
      const [totalBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.gmUserId, id));
      const [totalRevenue] = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
      }).from(bookings).where(and(eq(bookings.gmUserId, id), eq(bookings.status, "confirmed")));

      return reply.send({
        ok: true,
        data: {
          gmId: id,
          mesas: mesasCount?.count ?? 0,
          bookings: totalBookings?.count ?? 0,
          revenue: totalRevenue?.total ?? "0",
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get GM analytics");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
