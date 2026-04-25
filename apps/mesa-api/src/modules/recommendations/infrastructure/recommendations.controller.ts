import { FastifyInstance } from "fastify";
import { z } from "zod";
import { GetRecommendationsUseCase } from "../application/get-recommendations.use-case.js";
import { DrizzleRecommendationsRepository } from "./drizzle-recommendations.repository.js";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  city: z.string().optional(),
  system: z.string().optional(),
  format: z.enum(["presencial", "online", "hibrido"]).optional(),
  maxPrice: z.coerce.number().optional(),
  minSeats: z.coerce.number().int().optional(),
});

export async function recommendationsController(fastify: FastifyInstance) {
  const repository = new DrizzleRecommendationsRepository();
  const getRecommendationsUseCase = new GetRecommendationsUseCase(repository);

  fastify.get("/mesas/recomendadas", async (request, reply) => {
    const query = querySchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: query.error.flatten(),
      });
    }

    const { lat, lng, limit, offset, city, system, format, maxPrice, minSeats } = query.data;
    const userId = request.user?.id;

    try {
      const result = await getRecommendationsUseCase.execute({
        userId,
        lat,
        lng,
        limit,
        offset,
        city,
        system,
        format,
        maxPrice,
        minSeats,
      });

      return reply.send({
        data: result.recommendations.map((r) => r.toJSON()),
        meta: result.meta,
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get recommendations");
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });
}
