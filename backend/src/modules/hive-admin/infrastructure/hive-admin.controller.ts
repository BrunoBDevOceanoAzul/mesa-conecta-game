import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { profiles } from "../../../db/schema/profiles.js";

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Controller para administração de usuários no Hive.
 * Protegido por role — apenas admins podem acessar.
 */
export async function hiveAdminController(fastify: FastifyInstance) {
  // GET /hive-admin/:userId — Dados administrativos de um usuário
  fastify.get("/hive-admin/:userId", async (request, reply) => {
    // Verificar autenticação
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    // Verificar se é admin
    const isAdmin = request.user.role === "admin" || request.user.role === "service_role";
    if (!isAdmin) {
      return reply.status(403).send({ ok: false, error: "Forbidden: admin role required" });
    }

    // Validar parâmetro
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ ok: false, error: "Invalid user ID", details: params.error.flatten() });
    }

    const { userId } = params.data;

    try {
      // Buscar perfil do usuário alvo
      const [profile] = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({ ok: false, error: "User not found" });
      }

      // Buscar estatísticas (mesas, bookings, posts)
      const mesasResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM mesas WHERE gm_id = ${userId}`
      );
      const bookingsResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM bookings WHERE player_id = ${userId}`
      );
      const postsResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM posts WHERE author_id = ${userId}`
      );

      const totalMesas = Number((mesasResult[0] as any)?.count || 0);
      const totalBookings = Number((bookingsResult[0] as any)?.count || 0);
      const totalPosts = Number((postsResult[0] as any)?.count || 0);

      return reply.send({
        ok: true,
        data: {
          id: profile.userId,
          name: profile.name,
          displayName: profile.displayName,
          email: profile.email,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          websiteUrl: profile.websiteUrl,
          isPublic: profile.isPublic,
          ghostMode: profile.ghostMode,
          privacySettings: profile.privacySettings,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          stats: {
            totalMesas,
            totalBookings,
            totalPosts,
          },
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get hive admin user data");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // PATCH /hive-admin/:userId/role — Atualizar role do usuário
  fastify.patch("/hive-admin/:userId/role", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    if (request.user.role !== "admin") {
      return reply.status(403).send({ ok: false, error: "Forbidden: admin role required" });
    }

    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ ok: false, error: "Invalid user ID", details: params.error.flatten() });
    }

    const bodySchema = z.object({
      role: z.enum(["player", "gm", "store", "brand", "admin"]),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "Invalid body", details: body.error.flatten() });
    }

    try {
      await db.update(profiles)
        .set({ role: body.data.role, updatedAt: new Date() })
        .where(eq(profiles.userId, params.data.userId));

      return reply.send({ ok: true, role: body.data.role });
    } catch (err) {
      fastify.log.error({ err }, "Failed to update user role");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
