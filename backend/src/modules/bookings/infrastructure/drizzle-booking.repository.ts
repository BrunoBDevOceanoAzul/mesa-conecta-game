import { eq, and, gte, count, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { bookings } from "../../../db/schema/bookings.js";
import { mesas } from "../../../db/schema/mesas.js";
import { Booking, BookingData } from "../domain/booking.js";
import {
  BookingRepository,
  CreateBookingInput,
  ListBookingsFilters,
  ListBookingsResult,
  UpdateBookingInput,
} from "../domain/booking-repository.js";

function toDomain(raw: typeof bookings.$inferSelect): Booking {
  return new Booking(raw as unknown as BookingData);
}

export class DrizzleBookingRepository implements BookingRepository {
  async list(filters: ListBookingsFilters): Promise<ListBookingsResult> {
    const conditions = [];

    if (filters.playerUserId) {
      conditions.push(eq(bookings.playerUserId, filters.playerUserId));
    }

    if (filters.gmUserId) {
      conditions.push(eq(bookings.gmUserId, filters.gmUserId));
    }

    if (filters.gameTableId) {
      conditions.push(eq(bookings.gameTableId, filters.gameTableId));
    }

    if (filters.status) {
      conditions.push(eq(bookings.status, filters.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(whereClause);

    const rows = await db
      .select()
      .from(bookings)
      .where(whereClause)
      .orderBy(bookings.createdAt)
      .limit(filters.limit ?? 20)
      .offset(filters.offset ?? 0);

    return {
      bookings: rows.map(toDomain),
      total: Number(totalResult.count),
    };
  }

  async findById(id: string): Promise<Booking | null> {
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async findByPlayerAndMesa(playerUserId: string, gameTableId: string): Promise<Booking | null> {
    const [row] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.playerUserId, playerUserId),
          eq(bookings.gameTableId, gameTableId)
        )
      )
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async create(data: CreateBookingInput): Promise<Booking> {
    // Transação atômica: verificar vagas, decrementar, inserir booking
    const result = await db.transaction(async (tx) => {
      // 1. Verificar mesa existe e tem vagas
      const [mesa] = await tx
        .select()
        .from(mesas)
        .where(eq(mesas.id, data.gameTableId))
        .for("update");

      if (!mesa) {
        throw new Error("Mesa not found");
      }

      if (mesa.status !== "aberta") {
        throw new Error("Mesa is not open for bookings");
      }

      if (Number(mesa.seatsAvailable) < data.seatsReserved) {
        throw new Error("Not enough seats available");
      }

      // 2. Decrementar vagas
      await tx
        .update(mesas)
        .set({
          seatsAvailable: Number(mesa.seatsAvailable) - data.seatsReserved,
        })
        .where(eq(mesas.id, data.gameTableId));

      // 3. Inserir booking
      const [booking] = await tx
        .insert(bookings)
        .values({
          ...data,
          bookedAt: new Date(),
        } as any)
        .returning();

      return booking;
    });

    return toDomain(result);
  }

  async update(id: string, data: UpdateBookingInput): Promise<Booking | null> {
    const [row] = await db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(bookings.id, id))
      .returning();
    return row ? toDomain(row) : null;
  }

  async countPlayerMonthlyBookings(playerUserId: string, monthStart: Date): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.playerUserId, playerUserId),
          gte(bookings.createdAt, monthStart)
        )
      );
    return Number(result.count);
  }
}
