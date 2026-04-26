import { UseCase } from "../../../shared/domain/use-case.js";
import { Mesa } from "../domain/mesa.js";
import { CreateMesaInput, MesaRepository } from "../domain/mesa-repository.js";

export class CreateMesaUseCase implements UseCase<CreateMesaInput, Mesa> {
  constructor(private readonly repository: MesaRepository) {}

  async execute(data: CreateMesaInput): Promise<Mesa> {
    // Validações de negócio
    if (!data.title || data.title.trim().length < 3) {
      throw new Error("Title must be at least 3 characters long");
    }

    if (!data.system || data.system.trim().length === 0) {
      throw new Error("System is required");
    }

    if (data.seatsTotal < 1 || data.seatsTotal > 50) {
      throw new Error("Seats total must be between 1 and 50");
    }

    if (data.seatsAvailable < 0 || data.seatsAvailable > data.seatsTotal) {
      throw new Error("Seats available must be between 0 and seats total");
    }

    if (data.startAt <= new Date()) {
      throw new Error("Start date must be in the future");
    }

    return this.repository.create(data);
  }
}
