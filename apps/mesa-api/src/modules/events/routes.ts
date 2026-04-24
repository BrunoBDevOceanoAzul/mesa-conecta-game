import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/client.js";
import { events } from "../../db/schema/events.js";
import { AuthenticatedRequest } from "../auth/plugin.js";
import { createEventSchema } from "./schemas.js";

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.post("/", async (request: AuthenticatedRequest, reply) => {
    const body = createEventSchema.safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: body.error.flatten(),
      });
    }

    const { eventType, mesaId, gmId, payload, source, sessionId } = body.data;

    try {
      const [event] = await db
        .insert(events)
        .values({
          eventType,
          userId: request.user?.id || null,
          mesaId: mesaId || null,
          gmId: gmId || null,
          payload: payload || {},
          source: source || null,
          sessionId: sessionId || null,
          ipHash: request.ip ? await hashIp(request.ip) : null,
          userAgent: request.headers["user-agent"] || null,
        })
        .returning();

      return reply.status(201).send({
        success: true,
        data: event,
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to create event");
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "mesa-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
