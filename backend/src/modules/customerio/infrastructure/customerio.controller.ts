import { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../../lib/env.js";
import { CustomerIoCdpService } from "../../../shared/infrastructure/customerio/cdp.service.js";

const identifySchema = z.object({
  traits: z.record(z.string(), z.unknown()).default({}),
});

const trackSchema = z.object({
  event: z.string().min(1).max(120),
  properties: z.record(z.string(), z.unknown()).default({}),
});

export async function customerIoController(fastify: FastifyInstance) {
  const customerIo = new CustomerIoCdpService(
    env.CUSTOMERIO_EVENTS_WRITE_KEY ?? env.CUSTOMERIO_CDP_WRITE_KEY,
    env.CUSTOMERIO_CDP_API_BASE_URL
  );

  fastify.post("/customerio/identify", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    if (!customerIo.enabled) {
      return reply.status(503).send({ ok: false, error: "Customer.io is not configured" });
    }

    const parsed = identifySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Validation failed", details: parsed.error.flatten() });
    }

    try {
      await customerIo.identify({
        userId: request.user.id,
        traits: {
          ...parsed.data.traits,
          email: request.user.email,
        },
      });

      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error({ err }, "Customer.io identify failed");
      return reply.status(502).send({ ok: false, error: "Customer.io identify failed" });
    }
  });

  fastify.post("/customerio/track", async (request, reply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    if (!customerIo.enabled) {
      return reply.status(503).send({ ok: false, error: "Customer.io is not configured" });
    }

    const parsed = trackSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Validation failed", details: parsed.error.flatten() });
    }

    try {
      await customerIo.track({
        userId: request.user.id,
        event: parsed.data.event,
        properties: parsed.data.properties,
      });

      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error({ err }, "Customer.io track failed");
      return reply.status(502).send({ ok: false, error: "Customer.io track failed" });
    }
  });
}
