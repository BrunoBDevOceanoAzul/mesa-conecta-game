import { eq } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { asaasAccounts } from "../../../db/schema/billing.js";
import { AsaasAccount, AsaasAccountData, AsaasAccountRepository } from "../domain/asaas-account.js";

export class DrizzleAsaasAccountRepository implements AsaasAccountRepository {
  async findByUserId(userId: string): Promise<AsaasAccount | null> {
    const row = await db.query.asaasAccounts.findFirst({
      where: eq(asaasAccounts.userId, userId),
    });
    return row ? this.toDomain(row) : null;
  }

  async findByAsaasCustomerId(asaasCustomerId: string): Promise<AsaasAccount | null> {
    const row = await db.query.asaasAccounts.findFirst({
      where: eq(asaasAccounts.asaasCustomerId, asaasCustomerId),
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Omit<AsaasAccountData, "id" | "createdAt" | "updatedAt">): Promise<AsaasAccount> {
    const [row] = await db.insert(asaasAccounts).values(data).returning();
    return this.toDomain(row);
  }

  async update(userId: string, data: Partial<AsaasAccountData>): Promise<AsaasAccount | null> {
    const [row] = await db
      .update(asaasAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(asaasAccounts.userId, userId))
      .returning();
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: typeof asaasAccounts.$inferSelect): AsaasAccount {
    return new AsaasAccount({
      id: row.id,
      userId: row.userId,
      asaasCustomerId: row.asaasCustomerId,
      asaasWalletId: row.asaasWalletId,
      name: row.name,
      email: row.email,
      cpfCnpj: row.cpfCnpj,
      phone: row.phone,
      postalCode: row.postalCode,
      status: row.status as AsaasAccountData["status"],
      metadataJson: row.metadataJson as Record<string, unknown> | null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
