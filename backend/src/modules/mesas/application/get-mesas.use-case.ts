import { UseCase } from "../../../shared/domain/use-case.js";
import { MesaRepository, ListMesasFilters, ListMesasResult } from "../domain/mesa-repository.js";

export class GetMesasUseCase implements UseCase<ListMesasFilters, ListMesasResult> {
  constructor(private readonly repository: MesaRepository) {}

  async execute(filters: ListMesasFilters): Promise<ListMesasResult> {
    const safeFilters = {
      limit: Math.min(filters.limit ?? 20, 50),
      offset: Math.max(filters.offset ?? 0, 0),
      ...filters,
    };

    return this.repository.list(safeFilters);
  }
}
