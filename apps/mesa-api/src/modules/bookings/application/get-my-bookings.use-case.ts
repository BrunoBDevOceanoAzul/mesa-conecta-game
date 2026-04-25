import { UseCase } from "../../../shared/domain/use-case.js";
import { Booking } from "../domain/booking.js";
import { BookingRepository, ListBookingsFilters, ListBookingsResult } from "../domain/booking-repository.js";

export class GetMyBookingsUseCase implements UseCase<string, ListBookingsResult> {
  constructor(private readonly repository: BookingRepository) {}

  async execute(playerUserId: string): Promise<ListBookingsResult> {
    return this.repository.list({
      playerUserId,
      limit: 100,
      offset: 0,
    });
  }
}
