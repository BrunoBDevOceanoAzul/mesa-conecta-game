import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthenticatedRequest } from "../../auth/plugin.js";
import { GetMyProfileUseCase } from "../application/get-my-profile.use-case.js";
import { GetPublicProfileUseCase, ProfilePrivateError } from "../application/get-public-profile.use-case.js";
import { UpdateProfileUseCase } from "../application/update-profile.use-case.js";
import { DrizzleProfileRepository } from "../infrastructure/drizzle-profile.repository.js";
import { profileUpdateSchema } from "../schemas.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function profileController(fastify: FastifyInstance) {
  const repository = new DrizzleProfileRepository();
  const getMyProfileUseCase = new GetMyProfileUseCase(repository);
  const getPublicProfileUseCase = new GetPublicProfileUseCase(repository);
  const updateProfileUseCase = new UpdateProfileUseCase(repository);

  // GET /auth/me — Perfil completo do usuário autenticado
  fastify.get("/auth/me", async (request: AuthenticatedRequest, reply) => {
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
  fastify.get("/profiles/:id", async (request: AuthenticatedRequest, reply) => {
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

  // PUT /profiles/me — Atualizar perfil do usuário autenticado
  fastify.put("/profiles/me", async (request: AuthenticatedRequest, reply) => {
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
}
