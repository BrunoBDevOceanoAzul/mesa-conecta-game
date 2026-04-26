export interface AsaasAccountData {
  id: string;
  userId: string;
  asaasCustomerId: string;
  asaasWalletId: string | null;
  name: string | null;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  postalCode: string | null;
  status: "pending" | "active" | "inactive" | "suspended";
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AsaasAccount {
  constructor(private readonly data: AsaasAccountData) {}

  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get asaasCustomerId(): string { return this.data.asaasCustomerId; }
  get asaasWalletId(): string | null { return this.data.asaasWalletId; }
  get status(): string { return this.data.status; }
  get cpfCnpj(): string | null { return this.data.cpfCnpj; }
  get email(): string | null { return this.data.email; }

  get isActive(): boolean {
    return this.data.status === "active";
  }

  toJSON() {
    return { ...this.data };
  }
}

export interface AsaasAccountRepository {
  findByUserId(userId: string): Promise<AsaasAccount | null>;
  findByAsaasCustomerId(asaasCustomerId: string): Promise<AsaasAccount | null>;
  create(data: Omit<AsaasAccountData, "id" | "createdAt" | "updatedAt">): Promise<AsaasAccount>;
  update(userId: string, data: Partial<AsaasAccountData>): Promise<AsaasAccount | null>;
}

export interface AsaasCustomerGateway {
  createCustomer(input: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    postalCode?: string;
    externalReference?: string;
  }): Promise<{ id: string; walletId?: string }>;
}
