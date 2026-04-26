export interface PaymentData {
  id: string;
  userId: string;
  externalPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  provider: string;
  paymentType: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  constructor(private readonly data: PaymentData) {}

  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get externalPaymentId(): string | null { return this.data.externalPaymentId; }
  get amount(): number { return this.data.amount; }
  get status(): string { return this.data.status; }
  get description(): string | null { return this.data.description; }
  get provider(): string { return this.data.provider; }
  get paymentType(): string { return this.data.paymentType; }
  get metadataJson(): Record<string, unknown> | null { return this.data.metadataJson; }

  get isConfirmed(): boolean {
    return this.data.status === "paid" || this.data.status === "RECEIVED" || this.data.status === "CONFIRMED";
  }

  toJSON() {
    return { ...this.data };
  }
}

export interface CreatePaymentInput {
  bookingId: string;
  customerName: string;
  customerCpfCnpj: string;
  customerEmail: string;
  amount: number;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  description: string;
}

export interface SplitInput {
  walletId: string;
  percentualValue?: number;
  fixedValue?: number;
}

export interface AsaasPaymentResponse {
  id: string;
  status: string;
  invoiceUrl: string;
  pixQrCode?: string;
  pixCopiaCola?: string;
}

export interface PaymentRepository {
  create(data: Omit<PaymentData, "id" | "createdAt" | "updatedAt">): Promise<Payment>;
  findByAsaasId(asaasId: string): Promise<Payment | null>;
  findByBookingId(bookingId: string): Promise<Payment | null>;
  updateStatus(id: string, status: string): Promise<Payment | null>;
}

export interface AsaasGateway {
  createPayment(input: CreatePaymentInput): Promise<AsaasPaymentResponse>;
  createSplitPayment(input: CreatePaymentInput & { split: SplitInput }): Promise<AsaasPaymentResponse>;
  getPixQrCode(asaasPaymentId: string): Promise<{ qrCode: string; copiaCola: string } | null>;
}
