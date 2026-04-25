import { FastifyInstance } from "fastify";
import { z } from "zod";
import { GetMesasUseCase } from "../application/get-mesas.use-case.js";
import { GetMesaByIdUseCase } from "../application/get-mesa-by-id.use-case.js";
import { CreateMesaUseCase } from "../application/create-mesa.use-case.js";
import { DrizzleMesaRepository } from "./drizzle-mesa.repository.js";

const listMesasQuerySchema = z.object({
  city: z.string().optional(),
  system: z.string().optional(),
  format: z.enum(["presencial", "online", "hibrido"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0.1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const createMesaBodySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  system: z.string().min(1),
  format: z.enum(["presencial", "online", "hibrido"]).default("presencial"),
  sessionType: z.enum(["oneshot", "campanha", "aventura", "modulo"]).default("oneshot"),
  mesaType: z.string().optional(),
  status: z.enum(["aberta", "lotada", "encerrada", "cancelada"]).default("aberta"),
  gmId: z.string().uuid(),
  gmName: z.string().min(1),
  storeId: z.string().uuid().optional(),
  storeSlotId: z.string().uuid().optional(),
  boardGameId: z.string().uuid().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  seatsTotal: z.number().int().min(1).max(50).default(5),
  seatsAvailable: z.number().int().min(0).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  playStyles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  organizerName: z.string().optional(),
});

export async function mesaController(fastify: FastifyInstance) {
  const repository = new DrizzleMesaRepository();
  const getMesasUseCase = new GetMesasUseCase(repository);
  const getMesaByIdUseCase = new GetMesaByIdUseCase(repository);
  const createMesaUseCase = new CreateMesaUseCase(repository);

  // GET /mesas — Listar mesas com filtros
  fastify.get("/mesas", async (request, reply) => {
    const query = listMesasQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({
        ok: false,
        error: "Invalid query parameters",
        details: query.error.flatten(),
      });
    }

    try {
      const result = await getMesasUseCase.execute(query.data);
      return reply.send({
        ok: true,
        data: result.mesas.map((m) => m.toJSON()),
        meta: {
          total: result.total,
          limit: query.data.limit,
          offset: query.data.offset,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to list mesas");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // GET /mesas/:id — Detalhe da mesa
  fastify.get("/mesas/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const mesa = await getMesaByIdUseCase.execute(id);
      if (!mesa) {
        return reply.status(404).send({
          ok: false,
          error: "Mesa not found",
        });
      }

      return reply.send({
        ok: true,
        data: mesa.toJSON(),
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get mesa");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // POST /mesas — Criar mesa
  fastify.post("/mesas", async (request, reply) => {
    const body = createMesaBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        ok: false,
        error: "Invalid request body",
        details: body.error.flatten(),
      });
    }

    try {
      const data = body.data;
      const mesa = await createMesaUseCase.execute({
        ...data,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        seatsAvailable: data.seatsAvailable ?? data.seatsTotal,
        playStyles: data.playStyles ?? [],
        tags: data.tags ?? [],
        imageUrl: data.imageUrl ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        description: data.description ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        venue: data.venue ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        storeId: data.storeId ?? null,
        storeSlotId: data.storeSlotId ?? null,
        boardGameId: data.boardGameId ?? null,
        minPrice: data.minPrice ?? null,
        maxPrice: data.maxPrice ?? null,
        organizerName: data.organizerName ?? null,
        mesaType: data.mesaType ?? null,
        stripePriceId: null,
        stripeProductId: null,
      });

      return reply.status(201).send({
        ok: true,
        data: mesa.toJSON(),
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("must be")) {
        return reply.status(400).send({
          ok: false,
          error: err.message,
        });
      }
      fastify.log.error({ err }, "Failed to create mesa");
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });
}
