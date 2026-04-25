export interface PaymentData {
  id: string;
  bookingId: string;
  asaasPaymentId: string;
  amount: string;
  currency: string;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "CANCELLED";
  invoiceUrl: string | null;
  pixQrCode: string | null;
  pixCopiaCola: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  constructor(private readonly data: PaymentData) {}

  get id(): string { return this.data.id; }
  get bookingId(): string { return this.data.bookingId; }
  get asaasPaymentId(): string { return this.data.asaasPaymentId; }
  get amount(): string { return this.data.amount; }
  get status(): string { return this.data.status; }
  get pixQrCode(): string | null { return this.data.pixQrCode; }
  get pixCopiaCola(): string | null { return this.data.pixCopiaCola; }
  get invoiceUrl(): string | null { return this.data.invoiceUrl; }

  get isConfirmed(): boolean {
    return this.data.status === "RECEIVED" || this.data.status === "CONFIRMED";
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
  getPixQrCode(asaasPaymentId: string): Promise<{ qrCode: string; copiaCola: string } | null>;
}
