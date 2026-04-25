export interface MesaData {
  id: string;
  title: string;
  description: string | null;
  system: string;
  format: "presencial" | "online" | "hibrido";
  sessionType: "oneshot" | "campanha" | "aventura" | "modulo";
  mesaType: string | null;
  status: "aberta" | "lotada" | "encerrada" | "cancelada";
  gmId: string;
  gmName: string;
  storeId: string | null;
  storeSlotId: string | null;
  boardGameId: string | null;
  address: string | null;
  city: string | null;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  startAt: Date;
  endAt: Date | null;
  seatsTotal: number;
  seatsAvailable: number;
  minPrice: string | null;
  maxPrice: string | null;
  playStyles: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  coverImageUrl: string | null;
  organizerName: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Mesa {
  constructor(private readonly data: MesaData) {}

  get id(): string { return this.data.id; }
  get title(): string { return this.data.title; }
  get description(): string | null { return this.data.description; }
  get system(): string { return this.data.system; }
  get format(): string { return this.data.format; }
  get sessionType(): string { return this.data.sessionType; }
  get mesaType(): string | null { return this.data.mesaType; }
  get status(): string { return this.data.status; }
  get gmId(): string { return this.data.gmId; }
  get gmName(): string { return this.data.gmName; }
  get storeId(): string | null { return this.data.storeId; }
  get city(): string | null { return this.data.city; }
  get venue(): string | null { return this.data.venue; }
  get lat(): number | null { return this.data.lat; }
  get lng(): number | null { return this.data.lng; }
  get startAt(): Date { return this.data.startAt; }
  get endAt(): Date | null { return this.data.endAt; }
  get seatsTotal(): number { return this.data.seatsTotal; }
  get seatsAvailable(): number { return this.data.seatsAvailable; }
  get minPrice(): string | null { return this.data.minPrice; }
  get maxPrice(): string | null { return this.data.maxPrice; }
  get playStyles(): string[] | null { return this.data.playStyles; }
  get tags(): string[] | null { return this.data.tags; }
  get imageUrl(): string | null { return this.data.imageUrl; }
  get coverImageUrl(): string | null { return this.data.coverImageUrl; }
  get organizerName(): string | null { return this.data.organizerName; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  get isOpen(): boolean {
    return this.data.status === "aberta" && this.data.seatsAvailable > 0;
  }

  get price(): string | null {
    return this.data.minPrice ?? this.data.maxPrice ?? null;
  }

  toJSON() {
    return { ...this.data };
  }
}
