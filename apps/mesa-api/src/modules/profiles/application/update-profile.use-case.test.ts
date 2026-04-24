import { describe, it, expect, vi } from "vitest";
import { UpdateProfileUseCase } from "./update-profile.use-case.js";
import { Profile } from "../domain/profile.js";

describe("UpdateProfileUseCase", () => {
  it("updates profile successfully", async () => {
    const updatedProfile = new Profile({
      id: "1",
      userId: "user-1",
      name: "Test User",
      displayName: "New Name",
      email: "test@example.com",
      slug: "test",
      bio: "New bio",
      avatarUrl: null,
      coverImageUrl: null,
      city: "São Paulo",
      state: "SP",
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

    const repo = { findByUserId: vi.fn(), findById: vi.fn(), update: vi.fn().mockResolvedValue(updatedProfile) };
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute({ userId: "user-1", displayName: "New Name", bio: "New bio", city: "São Paulo", state: "SP" });

    expect(result).toEqual(updatedProfile);
    expect(repo.update).toHaveBeenCalledWith({ userId: "user-1", displayName: "New Name", bio: "New bio", city: "São Paulo", state: "SP" });
  });

  it("returns null when profile not found", async () => {
    const repo = { findByUserId: vi.fn(), findById: vi.fn(), update: vi.fn().mockResolvedValue(null) };
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute({ userId: "non-existent", displayName: "Test" });

    expect(result).toBeNull();
  });
});
