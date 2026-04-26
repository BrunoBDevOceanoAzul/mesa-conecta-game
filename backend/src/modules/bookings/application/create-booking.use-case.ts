import { UseCase } from "../../../shared/domain/use-case.js";
import { Booking } from "../domain/booking.js";
import { BookingRepository, CreateBookingInput } from "../domain/booking-repository.js";

export class CreateBookingUseCase implements UseCase<CreateBookingInput, Booking> {
  constructor(private readonly repository: BookingRepository) {}

  async execute(data: CreateBookingInput): Promise<Booking> {
    // Validações
    if (data.seatsReserved < 1 || data.seatsReserved > 10) {
      throw new Error("Seats reserved must be between 1 and 10");
    }

    if (Number(data.amount) < 0) {
      throw new Error("Amount cannot be negative");
    }

    // Verificar duplicata (não permite 2 bookings do mesmo jogador na mesma mesa)
    const existing = await this.repository.findByPlayerAndMesa(
      data.playerUserId,
      data.gameTableId
    );

    if (existing && !existing.isCanceled) {
      throw new Error("Player already has an active booking for this mesa");
    }

    return this.repository.create(data);
  }
}
