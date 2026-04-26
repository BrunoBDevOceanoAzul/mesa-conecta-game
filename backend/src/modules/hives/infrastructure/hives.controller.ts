import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { hives, hiveMembers } from "../../../db/schema/hives.js";
import { profiles } from "../../../db/schema/profiles.js";

const paramsSchema = z.object({
  hiveId: z.string().uuid(),
});

const createHiveSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

export async function hivesController(fastify: FastifyInstance) {
  // GET /hives — Listar clãs do usuário autenticado
  fastify.get("/hives", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    try {
      // Hives onde o usuário é membro
      const memberHives = await db.select({
        hiveId: hiveMembers.hiveId,
        memberRole: hiveMembers.role,
      })
        .from(hiveMembers)
        .where(eq(hiveMembers.userId, request.user.id));

      const hiveIds = memberHives.map(m => m.hiveId);

      if (hiveIds.length === 0) {
        return reply.send({ ok: true, data: [] });
      }

      const hiveList = await db.select()
        .from(hives)
        .where(eq(hives.id, hiveIds[0])); // TODO: usar IN quando drizzle suportar melhor

      // Buscar todos os hives (workaround para IN)
      const allHives = await db.select().from(hives);
      const userHives = allHives.filter(h => hiveIds.includes(h.id));

      // Enriquecer com dados do owner
      const enriched = await Promise.all(userHives.map(async (hive) => {
        const [ownerProfile] = await db.select({
          name: profiles.name,
          avatarUrl: profiles.avatarUrl,
        })
          .from(profiles)
          .where(eq(profiles.userId, hive.ownerId))
          .limit(1);

        const memberCount = await db.select()
          .from(hiveMembers)
          .where(eq(hiveMembers.hiveId, hive.id));

        const memberRole = memberHives.find(m => m.hiveId === hive.id)?.memberRole || 'member';

        return {
          ...hive,
          owner: ownerProfile || { name: 'Desconhecido' },
          memberCount: memberCount.length,
          myRole: memberRole,
        };
      }));

      return reply.send({ ok: true, data: enriched });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list hives");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // POST /hives — Criar clã
  fastify.post("/hives", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const body = createHiveSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "Validation failed", details: body.error.flatten() });
    }

    try {
      const [hive] = await db.insert(hives)
        .values({
          name: body.data.name,
          description: body.data.description,
          ownerId: request.user.id,
          isPublic: body.data.isPublic,
        })
        .returning();

      // Adicionar owner como membro
      await db.insert(hiveMembers)
        .values({
          hiveId: hive.id,
          userId: request.user.id,
          role: 'owner',
        })
        .onConflictDoNothing();

      return reply.status(201).send({ ok: true, data: hive });
    } catch (err) {
      fastify.log.error({ err }, "Failed to create hive");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET /hives/:hiveId — Detalhe do clã
  fastify.get("/hives/:hiveId", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ ok: false, error: "Invalid hive ID", details: params.error.flatten() });
    }

    try {
      const [hive] = await db.select()
        .from(hives)
        .where(eq(hives.id, params.data.hiveId))
        .limit(1);

      if (!hive) {
        return reply.status(404).send({ ok: false, error: "Hive not found" });
      }

      // Verificar se é membro
      const [membership] = await db.select()
        .from(hiveMembers)
        .where(and(
          eq(hiveMembers.hiveId, params.data.hiveId),
          eq(hiveMembers.userId, request.user.id)
        ))
        .limit(1);

      if (!membership && !hive.isPublic) {
        return reply.status(403).send({ ok: false, error: "Forbidden: not a member" });
      }

      // Buscar membros
      const members = await db.select({
        userId: hiveMembers.userId,
        role: hiveMembers.role,
        joinedAt: hiveMembers.joinedAt,
      })
        .from(hiveMembers)
        .where(eq(hiveMembers.hiveId, params.data.hiveId));

      // Enriquecer membros com perfil
      const enrichedMembers = await Promise.all(members.map(async (member) => {
        const [profile] = await db.select({
          name: profiles.name,
          avatarUrl: profiles.avatarUrl,
        })
          .from(profiles)
          .where(eq(profiles.userId, member.userId))
          .limit(1);

        return {
          ...member,
          name: profile?.name || 'Usuário',
          avatarUrl: profile?.avatarUrl,
        };
      }));

      return reply.send({
        ok: true,
        data: {
          ...hive,
          isMember: !!membership,
          myRole: membership?.role,
          members: enrichedMembers,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get hive");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // POST /hives/:hiveId/join — Entrar no clã
  fastify.post("/hives/:hiveId/join", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ ok: false, error: "Invalid hive ID", details: params.error.flatten() });
    }

    try {
      const [hive] = await db.select()
        .from(hives)
        .where(eq(hives.id, params.data.hiveId))
        .limit(1);

      if (!hive) {
        return reply.status(404).send({ ok: false, error: "Hive not found" });
      }

      if (!hive.isPublic) {
        return reply.status(403).send({ ok: false, error: "Hive is private" });
      }

      await db.insert(hiveMembers)
        .values({
          hiveId: params.data.hiveId,
          userId: request.user.id,
          role: 'member',
        })
        .onConflictDoNothing();

      return reply.send({ ok: true, message: "Joined hive successfully" });
    } catch (err) {
      fastify.log.error({ err }, "Failed to join hive");
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });
}
