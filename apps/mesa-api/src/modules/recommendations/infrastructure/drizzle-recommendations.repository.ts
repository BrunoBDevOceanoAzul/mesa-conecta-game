import { sql, desc, eq, and, gte, lte } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { mesas, mesaPopularityScores, mesaBoosts } from "../../../db/schema/mesas.js";
import { profiles } from "../../../db/schema/profiles.js";
import {
  RecommendationsRepository,
  MesaFilter,
  UserPreferences,
  RawMesaData,
} from "../domain/recommendation-repository.js";

export class DrizzleRecommendationsRepository implements RecommendationsRepository {
  async findMesas(filter: MesaFilter): Promise<RawMesaData[]> {
    const { city, system, format, maxPrice, minSeats, limit, offset } = filter;

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

    return db
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
      .limit(limit * 2)
      .offset(offset);
  }

  async findUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [profile] = await db
      .select({
        preferredSystems: profiles.preferredSystems,
        playStyles: profiles.playStyles,
        preferredFormat: profiles.preferredFormat,
        budgetRange: profiles.budgetRange,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) return null;

    return {
      preferredSystems: profile.preferredSystems as string[] | undefined,
      playStyles: profile.playStyles as string[] | undefined,
      preferredFormat: profile.preferredFormat ?? undefined,
      budgetRange: profile.budgetRange ?? undefined,
    };
  }
}
