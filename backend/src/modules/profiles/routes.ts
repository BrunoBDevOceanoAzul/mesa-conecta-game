import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { profiles, userRoles, playerProfiles, gmProfiles } from "../../db/schema/profiles.js";
import { mesas } from "../../db/schema/mesas.js";
import { bookings } from "../../db/schema/bookings.js";
import { profileUpdateSchema } from "./schemas.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function profileRoutes(fastify: FastifyInstance) {
  // GET /auth/me — Perfil completo do usuário autenticado
  fastify.get("/auth/me", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const userId = request.user.id;

      // Busca perfil principal
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      // Busca roles
      const roles = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      // Busca estatísticas de mesas como GM
      const [gmStats] = await db
        .select({
          totalMesas: sql<number>`count(*)::int`,
          totalBookings: sql<number>`COALESCE(SUM(${mesas.seatsTotal} - ${mesas.seatsAvailable}), 0)::int`,
        })
        .from(mesas)
        .where(eq(mesas.gmId, userId));

      // Busca estatísticas de player
      const [playerStats] = await db
        .select({
          totalBookings: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(eq(bookings.playerUserId, userId));

      // Busca playerProfile e gmProfile se existirem
      const [playerProfile] = await db
        .select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      const [gmProfile] = await db
        .select()
        .from(gmProfiles)
        .where(eq(gmProfiles.userId, userId))
        .limit(1);

      return reply.send({
        data: {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          displayName: profile.displayName,
          email: profile.email,
          slug: profile.slug,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverImageUrl: profile.coverImageUrl,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          instagramHandle: profile.instagramHandle,
          websiteUrl: profile.websiteUrl,
          role: profile.role,
          roles: roles.map((r) => r.role),
          capabilities: {
            canPlay: profile.canPlay,
            canGm: profile.canGm,
            canManageStore: profile.canManageStore,
            canManageBrand: profile.canManageBrand,
          },
          preferences: {
            preferredSystems: profile.preferredSystems,
            playStyles: profile.playStyles,
            experienceLevel: profile.experienceLevel,
            preferredFormat: profile.preferredFormat,
            budgetRange: profile.budgetRange,
          },
          onboarding: {
            completed: profile.onboardingCompleted,
            step: profile.onboardingStep,
          },
          stats: {
            gm: {
              totalMesas: gmStats?.totalMesas || 0,
              totalBookings: gmStats?.totalBookings || 0,
              averageRating: gmProfile?.averageRating || "0",
              totalReviews: gmProfile?.totalReviews || 0,
              reputationScore: gmProfile?.reputationScore || "0",
            },
            player: {
              totalBookings: playerStats?.totalBookings || 0,
              totalReviews: 0,
            },
            memberSince: profile.createdAt,
            lastLoginAt: profile.lastLoginAt,
          },
          playerProfile: playerProfile || null,
          gmProfile: gmProfile || null,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get current user profile");
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /profiles/:id — Perfil público
  fastify.get("/profiles/:id", async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid profile ID", details: params.error.flatten() });
    }

    try {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, params.data.id))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      // Se o perfil não é público e não é o próprio usuário, nega
      if (!profile.isPublic && profile.userId !== request.user?.id) {
        return reply.status(403).send({ error: "Profile is private" });
      }

      const [gmProfile] = await db
        .select()
        .from(gmProfiles)
        .where(eq(gmProfiles.userId, profile.userId))
        .limit(1);

      return reply.send({
        data: {
          id: profile.id,
          displayName: profile.displayName,
          slug: profile.slug,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverImageUrl: profile.coverImageUrl,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          instagramHandle: profile.instagramHandle,
          websiteUrl: profile.websiteUrl,
          role: profile.role,
          capabilities: {
            canPlay: profile.canPlay,
            canGm: profile.canGm,
            canManageStore: profile.canManageStore,
            canManageBrand: profile.canManageBrand,
          },
          preferences: {
            preferredSystems: profile.preferredSystems,
            playStyles: profile.playStyles,
            experienceLevel: profile.experienceLevel,
            preferredFormat: profile.preferredFormat,
          },
          badges: profile.badges,
          currentTitle: profile.currentTitle,
          gmStats: gmProfile
            ? {
                averageRating: gmProfile.averageRating,
                totalReviews: gmProfile.totalReviews,
                totalTables: gmProfile.totalTables,
                totalBookings: gmProfile.totalBookings,
                reputationScore: gmProfile.reputationScore,
                beginnerFriendly: gmProfile.beginnerFriendly,
                supportsCorporate: gmProfile.supportsCorporate,
                supportsTherapeutic: gmProfile.supportsTherapeutic,
                supportsEducational: gmProfile.supportsEducational,
              }
            : null,
          memberSince: profile.createdAt,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get public profile");
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // PUT /profiles/me — Atualizar perfil do usuário autenticado
  fastify.put("/profiles/me", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const body = profileUpdateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation failed", details: body.error.flatten() });
    }

    try {
      const userId = request.user.id;
      const data = body.data;

      const updateValues: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.displayName !== undefined) updateValues.displayName = data.displayName;
      if (data.bio !== undefined) updateValues.bio = data.bio;
      if (data.city !== undefined) updateValues.city = data.city;
      if (data.state !== undefined) updateValues.state = data.state;
      if (data.phone !== undefined) updateValues.phone = data.phone;
      if (data.whatsapp !== undefined) updateValues.whatsapp = data.whatsapp;
      if (data.instagramHandle !== undefined) updateValues.instagramHandle = data.instagramHandle;
      if (data.websiteUrl !== undefined) updateValues.websiteUrl = data.websiteUrl;
      if (data.avatarUrl !== undefined) updateValues.avatarUrl = data.avatarUrl;
      if (data.coverImageUrl !== undefined) updateValues.coverImageUrl = data.coverImageUrl;
      if (data.preferredSystems !== undefined) updateValues.preferredSystems = data.preferredSystems;
      if (data.playStyles !== undefined) updateValues.playStyles = data.playStyles;
      if (data.experienceLevel !== undefined) updateValues.experienceLevel = data.experienceLevel;
      if (data.preferredFormat !== undefined) updateValues.preferredFormat = data.preferredFormat;
      if (data.canPlay !== undefined) updateValues.canPlay = data.canPlay;
      if (data.canGm !== undefined) updateValues.canGm = data.canGm;
      if (data.canManageStore !== undefined) updateValues.canManageStore = data.canManageStore;
      if (data.canManageBrand !== undefined) updateValues.canManageBrand = data.canManageBrand;

      const [updated] = await db
        .update(profiles)
        .set(updateValues)
        .where(eq(profiles.userId, userId))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to update profile");
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
