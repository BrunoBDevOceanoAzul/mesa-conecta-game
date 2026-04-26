import { eq } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { payments } from "../../../db/schema/billing.js";
import { Payment, PaymentData, PaymentRepository } from "../domain/payment.js";

export class DrizzlePaymentRepository implements PaymentRepository {
  async create(data: Omit<PaymentData, "id" | "createdAt" | "updatedAt">): Promise<Payment> {
    const [row] = await db.insert(payments).values({
      userId: data.userId,
      provider: data.provider as "manual" | "stripe" | "asaas" | "pix",
      externalPaymentId: data.externalPaymentId,
      amount: data.amount,
      currency: data.currency,
      status: data.status as "pending" | "paid" | "failed" | "refunded" | "disputed",
      paymentType: data.paymentType as "subscription" | "credit_purchase" | "one_time" | "refund",
      description: data.description,
      metadataJson: data.metadataJson,
    }).returning();
    return this.toDomain(row);
  }

  async findByAsaasId(asaasId: string): Promise<Payment | null> {
    const row = await db.query.payments.findFirst({
      where: eq(payments.externalPaymentId, asaasId),
    });
    return row ? this.toDomain(row) : null;
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    const rows = await db.select().from(payments);
    const row = rows.find((r) => (r.metadataJson as any)?.bookingId === bookingId);
    return row ? this.toDomain(row) : null;
  }

  async updateStatus(id: string, status: string): Promise<Payment | null> {
    const [row] = await db
      .update(payments)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: typeof payments.$inferSelect): Payment {
    return new Payment({
      id: row.id,
      userId: row.userId,
      externalPaymentId: row.externalPaymentId ?? null,
      amount: Number(row.amount),
      currency: row.currency ?? "BRL",
      status: row.status ?? "pending",
      description: row.description ?? null,
      provider: row.provider ?? "manual",
      paymentType: row.paymentType ?? "one_time",
      metadataJson: (row.metadataJson as Record<string, unknown>) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
