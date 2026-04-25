import { Mesa, MesaData } from "./mesa.js";

export interface ListMesasFilters {
  city?: string;
  system?: string;
  format?: "presencial" | "online" | "hibrido";
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}

export interface ListMesasResult {
  mesas: Mesa[];
  total: number;
}

export type CreateMesaInput = Omit<MesaData, "id" | "createdAt" | "updatedAt">;
export type UpdateMesaInput = Partial<Omit<MesaData, "id" | "createdAt" | "updatedAt">>;

export interface MesaRepository {
  list(filters: ListMesasFilters): Promise<ListMesasResult>;
  findById(id: string): Promise<Mesa | null>;
  create(data: CreateMesaInput): Promise<Mesa>;
  update(id: string, data: UpdateMesaInput): Promise<Mesa | null>;
  delete(id: string): Promise<boolean>;
}
