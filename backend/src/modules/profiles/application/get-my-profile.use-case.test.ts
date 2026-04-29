import { describe, it, expect, vi } from "../../../test/node-test-compat.js";
import { GetMyProfileUseCase } from "./get-my-profile.use-case.js";
import { Profile } from "../domain/profile.js";

describe("GetMyProfileUseCase", () => {
  it("returns profile when user exists", async () => {
    const profile = new Profile({
      id: "1",
      userId: "user-1",
      name: "Test User",
      displayName: "Test",
      email: "test@example.com",
      slug: "test",
      bio: null,
      avatarUrl: null,
      coverImageUrl: null,
      city: null,
      state: null,
      country: null,
      phone: null,
      whatsapp: null,
      instagramHandle: null,
      websiteUrl: null,
      role: "user",
      roles: ["user"],
      isPublic: true,
      capabilities: { canPlay: true, canGm: false, canManageStore: false, canManageBrand: false },
      preferences: { preferredSystems: [], playStyles: [], experienceLevel: null, preferredFormat: null, budgetRange: null },
      onboarding: { completed: false, step: 0 },
      stats: { gm: { totalMesas: 0, totalBookings: 0, averageRating: "0", totalReviews: 0, reputationScore: "0" }, player: { totalBookings: 0, totalReviews: 0 }, memberSince: null, lastLoginAt: null },
      playerProfile: null,
      gmProfile: null,
    });

    const repo = { findByUserId: vi.fn().mockResolvedValue(profile), findById: vi.fn(), update: vi.fn() };
    const useCase = new GetMyProfileUseCase(repo);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result).toEqual(profile);
    expect(repo.findByUserId).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("returns null when profile not found", async () => {
    const repo = { findByUserId: vi.fn().mockResolvedValue(null), findById: vi.fn(), update: vi.fn() };
    const useCase = new GetMyProfileUseCase(repo);

    const result = await useCase.execute({ userId: "non-existent" });

    expect(result).toBeNull();
  });
});
