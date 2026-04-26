import { UseCase } from "../../../shared/domain/use-case.js";
import { Booking } from "../domain/booking.js";
import { BookingRepository } from "../domain/booking-repository.js";

export interface CancelBookingInput {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
}

export class CancelBookingUseCase implements UseCase<CancelBookingInput, Booking> {
  constructor(private readonly repository: BookingRepository) {}

  async execute(input: CancelBookingInput): Promise<Booking> {
    const booking = await this.repository.findById(input.bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Apenas o dono da reserva, o GM da mesa, ou admin pode cancelar
    const canCancel =
      input.isAdmin ||
      booking.playerUserId === input.userId ||
      booking.gmUserId === input.userId ||
      booking.storeUserId === input.userId;

    if (!canCancel) {
      throw new Error("Unauthorized to cancel this booking");
    }

    if (booking.isCanceled) {
      throw new Error("Booking is already canceled");
    }

    const updated = await this.repository.update(input.bookingId, {
      status: "canceled",
      canceledAt: new Date(),
    });

    if (!updated) {
      throw new Error("Failed to cancel booking");
    }

    return updated;
  }
}
