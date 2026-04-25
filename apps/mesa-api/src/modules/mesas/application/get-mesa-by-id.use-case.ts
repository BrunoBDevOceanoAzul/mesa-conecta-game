import { UseCase } from "../../../shared/domain/use-case.js";
import { Mesa } from "../domain/mesa.js";
import { MesaRepository } from "../domain/mesa-repository.js";

export class GetMesaByIdUseCase implements UseCase<string, Mesa | null> {
  constructor(private readonly repository: MesaRepository) {}

  async execute(id: string): Promise<Mesa | null> {
    if (!id || id.trim() === "") {
      return null;
    }

    return this.repository.findById(id);
  }
}
