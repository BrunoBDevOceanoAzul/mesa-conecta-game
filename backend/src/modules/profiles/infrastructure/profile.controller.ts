import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { GetMyProfileUseCase } from "../application/get-my-profile.use-case.js";
import { GetPublicProfileUseCase, ProfilePrivateError } from "../application/get-public-profile.use-case.js";
import { GetProfileBySlugUseCase } from "../application/get-profile-by-slug.use-case.js";
import { UpdateProfileUseCase } from "../application/update-profile.use-case.js";
import { DrizzleProfileRepository } from "../infrastructure/drizzle-profile.repository.js";
import { profileUpdateSchema } from "../schemas.js";
import { db } from "../../../db/client.js";
import { profiles } from "../../../db/schema/profiles.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function profileController(fastify: FastifyInstance) {
  const repository = new DrizzleProfileRepository();
  const getMyProfileUseCase = new GetMyProfileUseCase(repository);
  const getPublicProfileUseCase = new GetPublicProfileUseCase(repository);
  const getProfileBySlugUseCase = new GetProfileBySlugUseCase(repository);
  const updateProfileUseCase = new UpdateProfileUseCase(repository);

  // GET /auth/me — Perfil completo do usuário autenticado
  fastify.get("/auth/me", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const profile = await getMyProfileUseCase.execute({ userId: request.user.id });

      if (!profile) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      return reply.send({ data: profile.toJSON() });
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
      const profile = await getPublicProfileUseCase.execute({
        id: params.data.id,
        viewerUserId: request.user?.id,
      });

      if (!profile) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      // Usa toPublicJSON para não expor dados sensíveis (email, phone, etc.)
      return reply.send({ data: profile.toPublicJSON() });
    } catch (err) {
      if (err instanceof ProfilePrivateError) {
        return reply.status(403).send({ error: "Profile is private" });
      }
      fastify.log.error({ err }, "Failed to get public profile");
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /profiles/slug/:slug — Perfil público por slug
  fastify.get("/profiles/slug/:slug", async (request, reply) => {
    const slugSchema = z.object({ slug: z.string().min(1) });
    const params = slugSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid slug", details: params.error.flatten() });
    }

    try {
      const profile = await getProfileBySlugUseCase.execute({
        slug: params.data.slug,
        viewerUserId: request.user?.id,
      });

      if (!profile) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      return reply.send({ data: profile.toPublicJSON() });
    } catch (err) {
      if (err instanceof ProfilePrivateError) {
        return reply.status(403).send({ error: "Profile is private" });
      }
      fastify.log.error({ err }, "Failed to get profile by slug");
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
      const updated = await updateProfileUseCase.execute({
        userId: request.user.id,
        ...body.data,
      });

      if (!updated) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      return reply.send({ success: true, data: updated.toJSON() });
    } catch (err) {
      fastify.log.error({ err }, "Failed to update profile");
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // PATCH /profiles/me/ghost — Toggle Ghost Mode
  fastify.patch("/profiles/me/ghost", {
    schema: {
      tags: ["Profiles"],
      summary: "Toggle Ghost Mode",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          ghostMode: { type: "boolean" },
        },
        required: ["ghostMode"],
      },
    },
  }, async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const bodySchema = z.object({ ghostMode: z.boolean() });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "Invalid body", details: body.error.flatten() });
    }

    try {
      await db.update(profiles)
        .set({ ghostMode: body.data.ghostMode, updatedAt: new Date() })
        .where(eq(profiles.userId, request.user.id));
      
      return reply.send({ ok: true, ghostMode: body.data.ghostMode });
    } catch (err) {
      fastify.log.error({ err }, "Failed to update ghost mode");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // PATCH /profiles/me/privacy — Update Privacy Settings
  fastify.patch("/profiles/me/privacy", {
    schema: {
      tags: ["Profiles"],
      summary: "Update Privacy Settings",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          network: { type: "boolean" },
          hives: { type: "boolean" },
          market: { type: "boolean" },
          academy: { type: "boolean" },
          playground: { type: "boolean" },
          radar: { type: "boolean" },
        },
      },
    },
  }, async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const bodySchema = z.object({
      network: z.boolean().optional(),
      hives: z.boolean().optional(),
      market: z.boolean().optional(),
      academy: z.boolean().optional(),
      playground: z.boolean().optional(),
      radar: z.boolean().optional(),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "Invalid body", details: body.error.flatten() });
    }

    try {
      // Get current privacy settings
      const [profile] = await db.select({ privacySettings: profiles.privacySettings })
        .from(profiles)
        .where(eq(profiles.userId, request.user.id))
        .limit(1);

      const current = (profile?.privacySettings as Record<string, boolean>) || {
        network: true, hives: true, market: true, 
        academy: true, playground: true, radar: true,
      };

      const updated = { ...current, ...body.data };

      await db.update(profiles)
        .set({ privacySettings: updated, updatedAt: new Date() })
        .where(eq(profiles.userId, request.user.id));

      return reply.send({ ok: true, privacySettings: updated });
    } catch (err) {
      fastify.log.error({ err }, "Failed to update privacy settings");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
