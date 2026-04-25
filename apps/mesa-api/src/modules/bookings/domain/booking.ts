export interface BookingData {
  id: string;
  gameTableId: string;
  tableSessionId: string | null;
  playerUserId: string;
  gmUserId: string;
  storeUserId: string | null;
  status: "pending" | "confirmed" | "canceled" | "completed" | "refunded" | "waitlist";
  seatsReserved: number;
  amount: string;
  currency: string;
  paymentStatus: "unpaid" | "paid" | "refunded" | "failed";
  bookedAt: Date;
  canceledAt: Date | null;
  completedAt: Date | null;
  sourceType: "organic" | "referral" | "campaign" | "boost";
  stripeCheckoutSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Booking {
  constructor(private readonly data: BookingData) {}

  get id(): string { return this.data.id; }
  get gameTableId(): string { return this.data.gameTableId; }
  get playerUserId(): string { return this.data.playerUserId; }
  get gmUserId(): string { return this.data.gmUserId; }
  get storeUserId(): string | null { return this.data.storeUserId; }
  get status(): string { return this.data.status; }
  get seatsReserved(): number { return this.data.seatsReserved; }
  get amount(): string { return this.data.amount; }
  get currency(): string { return this.data.currency; }
  get paymentStatus(): string { return this.data.paymentStatus; }
  get bookedAt(): Date { return this.data.bookedAt; }
  get canceledAt(): Date | null { return this.data.canceledAt; }
  get completedAt(): Date | null { return this.data.completedAt; }
  get sourceType(): string { return this.data.sourceType; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  get isConfirmed(): boolean {
    return this.data.status === "confirmed";
  }

  get isCanceled(): boolean {
    return this.data.status === "canceled";
  }

  get isPaid(): boolean {
    return this.data.paymentStatus === "paid";
  }

  toJSON() {
    return { ...this.data };
  }
}
