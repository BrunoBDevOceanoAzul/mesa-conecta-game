import { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, desc, eq, and, gte, lte } from "drizzle-orm";
import { db } from "../../db/client.js";
import { mesas, mesaPopularityScores, mesaBoosts } from "../../db/schema/mesas.js";
import { profiles } from "../../db/schema/profiles.js";
import { events } from "../../db/schema/events.js";
import { AuthenticatedRequest } from "../auth/plugin.js";

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

// Pesos do algoritmo v1
const WEIGHTS = {
  proximity: 0.25,
  preferenceMatch: 0.20,
  gmQuality: 0.20,
  popularity: 0.15,
  freshness: 0.10,
  boost: 0.10,
};

export async function recommendationRoutes(fastify: FastifyInstance) {
  fastify.get("/mesas/recomendadas", async (request: AuthenticatedRequest, reply) => {
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
      // Busca preferências do usuário se estiver autenticado
      let userProfile = null;
      if (userId) {
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);
        userProfile = profile;
      }

      // Query base
      let conditions = [eq(mesas.status, "aberta")];

      if (city) {
        conditions.push(sql`${mesas.city} ILIKE ${city}`);
      }
      if (system) {
        conditions.push(sql`${mesas.system} ILIKE ${system}`);
      }
      if (format) {
        conditions.push(eq(mesas.format, format));
      }
      if (maxPrice) {
        conditions.push(lte(mesas.maxPrice, String(maxPrice)));
      }
      if (minSeats) {
        conditions.push(gte(mesas.seatsAvailable, minSeats));
      }

      // Busca mesas com dados relacionados
      const mesasList = await db
        .select({
          mesa: mesas,
          popularity: mesaPopularityScores,
          boost: mesaBoosts,
        })
        .from(mesas)
        .leftJoin(mesaPopularityScores, eq(mesaPopularityScores.mesaId, mesas.id))
        .leftJoin(mesaBoosts, eq(mesaBoosts.mesaId, mesas.id))
        .where(and(...conditions))
        .orderBy(desc(mesas.createdAt))
        .limit(limit * 2) // Busca mais para depois ordenar
        .offset(offset);

      // Calcula score para cada mesa
      const scoredMesas = mesasList.map(({ mesa, popularity, boost }) => {
        const scores = {
          proximity: calculateProximityScore(lat, lng, mesa.lat, mesa.lng),
          preferenceMatch: calculatePreferenceMatch(userProfile, mesa),
          gmQuality: calculateGmQualityScore(mesa.gmId),
          popularity: parseFloat(popularity?.popularityScore || "0") / 100,
          freshness: calculateFreshnessScore(mesa.createdAt),
          boost: parseFloat(boost?.boostScore || "0") / 100,
        };

        const totalScore =
          WEIGHTS.proximity * scores.proximity +
          WEIGHTS.preferenceMatch * scores.preferenceMatch +
          WEIGHTS.gmQuality * scores.gmQuality +
          WEIGHTS.popularity * scores.popularity +
          WEIGHTS.freshness * scores.freshness +
          WEIGHTS.boost * scores.boost;

        return {
          ...mesa,
          score: totalScore,
          scores,
        };
      });

      // Ordena por score e limita resultados
      const sortedMesas = scoredMesas
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Retorna resultado
      return reply.send({
        data: sortedMesas,
        meta: {
          total: sortedMesas.length,
          limit,
          offset,
          userLocation: lat && lng ? { lat, lng } : null,
          weights: WEIGHTS,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, "Failed to get recommendations");
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });
}

function calculateProximityScore(
  userLat?: number,
  userLng?: number,
  mesaLat?: number | null,
  mesaLng?: number | null
): number {
  if (!userLat || !userLng || !mesaLat || !mesaLng) {
    return 0.5; // Score neutro quando não há dados de localização
  }

  const distance = haversineDistance(userLat, userLng, mesaLat, mesaLng);

  // Função decrescente: score alto para distâncias pequenas
  // 0km = 1.0, 5km = 0.5, 20km = 0.2, 50km+ = 0.05
  if (distance < 1) return 1.0;
  if (distance < 5) return 0.8;
  if (distance < 10) return 0.6;
  if (distance < 20) return 0.4;
  if (distance < 50) return 0.2;
  return 0.05;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculatePreferenceMatch(
  userProfile: any,
  mesa: any
): number {
  if (!userProfile) {
    return 0.5; // Score neutro para usuários não autenticados
  }

  let matches = 0;
  let totalFactors = 0;

  // Match de sistemas preferidos
  if (userProfile.preferredSystems?.length > 0) {
    totalFactors++;
    if (userProfile.preferredSystems.includes(mesa.system)) {
      matches++;
    }
  }

  // Match de estilos de jogo
  if (userProfile.playStyles?.length > 0 && mesa.playStyles?.length > 0) {
    totalFactors++;
    const commonStyles = userProfile.playStyles.filter((style: string) =>
      mesa.playStyles.includes(style)
    );
    if (commonStyles.length > 0) {
      matches += commonStyles.length / Math.max(userProfile.playStyles.length, mesa.playStyles.length);
    }
  }

  // Match de formato
  if (userProfile.preferredFormat) {
    totalFactors++;
    if (userProfile.preferredFormat === mesa.format) {
      matches++;
    }
  }

  // Match de faixa de preço
  if (userProfile.budgetRange && mesa.maxPrice) {
    totalFactors++;
    const budget = parseFloat(userProfile.budgetRange);
    const price = parseFloat(mesa.maxPrice);
    if (price <= budget) {
      matches++;
    }
  }

  if (totalFactors === 0) return 0.5;
  return matches / totalFactors;
}

function calculateGmQualityScore(gmId: string): number {
  // TODO: Implementar com dados reais do gm_profiles
  // Por enquanto retorna score neutro
  return 0.5;
}

function calculateFreshnessScore(createdAt: Date | null): number {
  if (!createdAt) return 0.5;

  const now = new Date();
  const ageDays = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

  // Decaimento exponencial
  // 0 dias = 1.0, 7 dias = 0.5, 30 dias = 0.2, 90 dias+ = 0.05
  const score = Math.exp(-ageDays / 10);
  return Math.max(0.05, Math.min(1.0, score));
}
