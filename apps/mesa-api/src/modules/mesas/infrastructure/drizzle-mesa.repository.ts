import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { mesas } from "../../../db/schema/mesas.js";
import { Mesa, MesaData } from "../domain/mesa.js";
import {
  CreateMesaInput,
  ListMesasFilters,
  ListMesasResult,
  MesaRepository,
  UpdateMesaInput,
} from "../domain/mesa-repository.js";

function toDomain(raw: typeof mesas.$inferSelect): Mesa {
  return new Mesa(raw as unknown as MesaData);
}

export class DrizzleMesaRepository implements MesaRepository {
  async list(filters: ListMesasFilters): Promise<ListMesasResult> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(mesas.status, filters.status as any));
    } else {
      conditions.push(eq(mesas.status, "aberta" as any));
    }

    if (filters.city) {
      conditions.push(eq(mesas.city, filters.city));
    }

    if (filters.system) {
      conditions.push(eq(mesas.system, filters.system));
    }

    if (filters.format) {
      conditions.push(eq(mesas.format, filters.format as any));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(mesas.minPrice, String(filters.minPrice)));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(mesas.maxPrice, String(filters.maxPrice)));
    }

    if (filters.startDate) {
      conditions.push(gte(mesas.startAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(mesas.startAt, filters.endDate));
    }

    if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm) {
      const radiusMeters = filters.radiusKm * 1000;
      conditions.push(
        sql`ST_DWithin(
          ST_MakePoint(${mesas.lng}, ${mesas.lat})::geography,
          ST_MakePoint(${filters.lng}, ${filters.lat})::geography,
          ${radiusMeters}
        )`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(mesas)
      .where(whereClause);

    const rows = await db
      .select()
      .from(mesas)
      .where(whereClause)
      .orderBy(mesas.startAt)
      .limit(filters.limit ?? 20)
      .offset(filters.offset ?? 0);

    return {
      mesas: rows.map(toDomain),
      total: Number(totalResult.count),
    };
  }

  async findById(id: string): Promise<Mesa | null> {
    const [row] = await db.select().from(mesas).where(eq(mesas.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async create(data: CreateMesaInput): Promise<Mesa> {
    const [row] = await db.insert(mesas).values(data as any).returning();
    return toDomain(row);
  }

  async update(id: string, data: UpdateMesaInput): Promise<Mesa | null> {
    const [row] = await db
      .update(mesas)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(mesas.id, id))
      .returning();
    return row ? toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(mesas).where(eq(mesas.id, id)).returning();
    return result.length > 0;
  }
}
