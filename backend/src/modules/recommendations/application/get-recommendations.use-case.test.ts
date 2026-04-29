import { describe, it, expect, vi } from "../../../test/node-test-compat.js";
import { GetRecommendationsUseCase } from "./get-recommendations.use-case.js";
import { Recommendation } from "../domain/recommendation.js";
import { RawMesaData, UserPreferences } from "../domain/recommendation-repository.js";

function makeMesa(overrides: Partial<RawMesaData["mesa"]> = {}): RawMesaData {
  return {
    mesa: {
      id: "mesa-1",
      title: "Test Mesa",
      status: "aberta",
      lat: -23.5,
      lng: -46.6,
      system: "D&D 5e",
      format: "presencial",
      maxPrice: "50",
      seatsAvailable: 4,
      gmId: "gm-1",
      createdAt: new Date(),
      ...overrides,
    },
    popularity: { popularityScore: "80" },
    boost: { boostScore: "10" },
  };
}

describe("GetRecommendationsUseCase", () => {
  it("returns recommendations sorted by score", async () => {
    const repo = {
      findMesas: vi.fn().mockResolvedValue([
        makeMesa({ id: "mesa-1", lat: -23.5, lng: -46.6, createdAt: new Date() }),
        makeMesa({ id: "mesa-2", lat: -23.6, lng: -46.7, createdAt: new Date(Date.now() - 86400000 * 20) }),
      ]),
      findUserPreferences: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetRecommendationsUseCase(repo);

    const result = await useCase.execute({
      lat: -23.5,
      lng: -46.6,
      limit: 10,
      offset: 0,
    });

    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].mesaId).toBe("mesa-1");
    expect(result.recommendations[0].score).toBeGreaterThan(result.recommendations[1].score);
    expect(result.meta.total).toBe(2);
    expect(result.meta.userLocation).toEqual({ lat: -23.5, lng: -46.6 });
  });

  it("uses preference match when user profile exists", async () => {
    const userPrefs: UserPreferences = {
      preferredSystems: ["D&D 5e"],
      playStyles: ["narrativo"],
      preferredFormat: "presencial",
      budgetRange: "100",
    };

    const repo = {
      findMesas: vi.fn().mockResolvedValue([
        makeMesa({ id: "mesa-1", system: "D&D 5e", format: "presencial", maxPrice: "50" }),
        makeMesa({ id: "mesa-2", system: "Pathfinder", format: "online", maxPrice: "150" }),
      ]),
      findUserPreferences: vi.fn().mockResolvedValue(userPrefs),
    };

    const useCase = new GetRecommendationsUseCase(repo);

    const result = await useCase.execute({
      userId: "user-1",
      limit: 10,
      offset: 0,
    });

    expect(result.recommendations[0].mesaId).toBe("mesa-1");
    expect(result.recommendations[0].scores.preferenceMatch).toBeGreaterThan(
      result.recommendations[1].scores.preferenceMatch
    );
  });

  it("limits results to requested limit", async () => {
    const repo = {
      findMesas: vi.fn().mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => makeMesa({ id: `mesa-${i}` }))
      ),
      findUserPreferences: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetRecommendationsUseCase(repo);

    const result = await useCase.execute({
      limit: 3,
      offset: 0,
    });

    expect(result.recommendations).toHaveLength(3);
    expect(result.meta.limit).toBe(3);
  });

  it("returns neutral scores when no location or profile", async () => {
    const repo = {
      findMesas: vi.fn().mockResolvedValue([makeMesa()]),
      findUserPreferences: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetRecommendationsUseCase(repo);

    const result = await useCase.execute({ limit: 10, offset: 0 });

    const rec = result.recommendations[0];
    expect(rec.scores.proximity).toBe(0.5);
    expect(rec.scores.preferenceMatch).toBe(0.5);
    expect(rec.scores.gmQuality).toBe(0.5);
  });
});
