import { UseCase } from "../../../shared/domain/use-case.js";
import { Recommendation } from "../domain/recommendation.js";
import {
  RecommendationsRepository,
  MesaFilter,
  UserPreferences,
  RawMesaData,
} from "../domain/recommendation-repository.js";

// Pesos do algoritmo v1
const WEIGHTS = {
  proximity: 0.25,
  preferenceMatch: 0.20,
  gmQuality: 0.20,
  popularity: 0.15,
  freshness: 0.10,
  boost: 0.10,
};

export interface GetRecommendationsInput extends MesaFilter {
  userId?: string;
}

export interface GetRecommendationsOutput {
  recommendations: Recommendation[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    userLocation: { lat: number; lng: number } | null;
    weights: typeof WEIGHTS;
  };
}

export class GetRecommendationsUseCase
  implements UseCase<GetRecommendationsInput, GetRecommendationsOutput>
{
  constructor(private readonly repository: RecommendationsRepository) {}

  async execute(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
    const { userId, lat, lng, limit, offset } = input;

    // Busca preferências do usuário
    let userPreferences: UserPreferences | null = null;
    if (userId) {
      userPreferences = await this.repository.findUserPreferences(userId);
    }

    // Busca mesas
    const rawMesas = await this.repository.findMesas(input);

    // Calcula score para cada mesa
    const scoredMesas = rawMesas.map(({ mesa, popularity, boost }) => {
      const scores = {
        proximity: this.calculateProximityScore(
          lat,
          lng,
          mesa.lat as number | undefined,
          mesa.lng as number | undefined
        ),
        preferenceMatch: this.calculatePreferenceMatch(userPreferences, mesa),
        gmQuality: this.calculateGmQualityScore(mesa.gmId as string),
        popularity: parseFloat(popularity?.popularityScore || "0") / 100,
        freshness: this.calculateFreshnessScore(mesa.createdAt as Date | null),
        boost: parseFloat(boost?.boostScore || "0") / 100,
      };

      const totalScore =
        WEIGHTS.proximity * scores.proximity +
        WEIGHTS.preferenceMatch * scores.preferenceMatch +
        WEIGHTS.gmQuality * scores.gmQuality +
        WEIGHTS.popularity * scores.popularity +
        WEIGHTS.freshness * scores.freshness +
        WEIGHTS.boost * scores.boost;

      return new Recommendation({
        mesaId: mesa.id as string,
        score: totalScore,
        scores,
        mesaData: mesa,
      });
    });

    // Ordena por score e limita resultados
    const sortedMesas = scoredMesas
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations: sortedMesas,
      meta: {
        total: sortedMesas.length,
        limit,
        offset,
        userLocation: lat && lng ? { lat, lng } : null,
        weights: { ...WEIGHTS },
      },
    };
  }

  private calculateProximityScore(
    userLat?: number,
    userLng?: number,
    mesaLat?: number | null,
    mesaLng?: number | null
  ): number {
    if (!userLat || !userLng || !mesaLat || !mesaLng) {
      return 0.5;
    }

    const distance = this.haversineDistance(userLat, userLng, mesaLat, mesaLng);

    if (distance < 1) return 1.0;
    if (distance < 5) return 0.8;
    if (distance < 10) return 0.6;
    if (distance < 20) return 0.4;
    if (distance < 50) return 0.2;
    return 0.05;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculatePreferenceMatch(
    userProfile: UserPreferences | null,
    mesa: Record<string, unknown>
  ): number {
    if (!userProfile) {
      return 0.5;
    }

    let matches = 0;
    let totalFactors = 0;

    if (userProfile.preferredSystems?.length) {
      totalFactors++;
      if (userProfile.preferredSystems.includes(mesa.system as string)) {
        matches++;
      }
    }

    if (userProfile.playStyles?.length && (mesa.playStyles as string[])?.length) {
      totalFactors++;
      const commonStyles = userProfile.playStyles.filter((style: string) =>
        (mesa.playStyles as string[]).includes(style)
      );
      if (commonStyles.length > 0) {
        matches += commonStyles.length / Math.max(userProfile.playStyles.length, (mesa.playStyles as string[]).length);
      }
    }

    if (userProfile.preferredFormat) {
      totalFactors++;
      if (userProfile.preferredFormat === mesa.format) {
        matches++;
      }
    }

    if (userProfile.budgetRange && mesa.maxPrice) {
      totalFactors++;
      const budget = parseFloat(userProfile.budgetRange);
      const price = parseFloat(mesa.maxPrice as string);
      if (price <= budget) {
        matches++;
      }
    }

    if (totalFactors === 0) return 0.5;
    return matches / totalFactors;
  }

  private calculateGmQualityScore(_gmId: string): number {
    return 0.5;
  }

  private calculateFreshnessScore(createdAt: Date | null): number {
    if (!createdAt) return 0.5;

    const now = new Date();
    const ageDays = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const score = Math.exp(-ageDays / 10);
    return Math.max(0.05, Math.min(1.0, score));
  }
}
