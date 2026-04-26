import { Booking, BookingData } from "./booking.js";

export interface ListBookingsFilters {
  playerUserId?: string;
  gmUserId?: string;
  gameTableId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListBookingsResult {
  bookings: Booking[];
  total: number;
}

export type CreateBookingInput = Omit<BookingData, "id" | "createdAt" | "updatedAt" | "bookedAt" | "canceledAt" | "completedAt">;
export type UpdateBookingInput = Partial<Pick<BookingData, "status" | "paymentStatus" | "canceledAt" | "completedAt" | "stripeCheckoutSessionId">>;

export interface BookingRepository {
  list(filters: ListBookingsFilters): Promise<ListBookingsResult>;
  findById(id: string): Promise<Booking | null>;
  findByPlayerAndMesa(playerUserId: string, gameTableId: string): Promise<Booking | null>;
  create(data: CreateBookingInput): Promise<Booking>;
  update(id: string, data: UpdateBookingInput): Promise<Booking | null>;
  countPlayerMonthlyBookings(playerUserId: string, monthStart: Date): Promise<number>;
}
