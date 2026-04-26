import { Recommendation } from "./recommendation.js";

export interface MesaFilter {
  lat?: number;
  lng?: number;
  city?: string;
  system?: string;
  format?: "presencial" | "online" | "hibrido";
  maxPrice?: number;
  minSeats?: number;
  limit: number;
  offset: number;
}

export interface UserPreferences {
  preferredSystems?: string[];
  playStyles?: string[];
  preferredFormat?: string;
  budgetRange?: string;
}

export interface RawMesaData {
  mesa: Record<string, unknown>;
  popularity: { popularityScore: string | null } | null;
  boost: { boostScore: string | null } | null;
}

export interface RecommendationsRepository {
  findMesas(filter: MesaFilter): Promise<RawMesaData[]>;
  findUserPreferences(userId: string): Promise<UserPreferences | null>;
}
