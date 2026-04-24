import { describe, it, expect, vi } from "vitest";
import { GetPublicProfileUseCase, ProfilePrivateError } from "./get-public-profile.use-case.js";
import { Profile, ProfileProps } from "../domain/profile.js";

function createMockProfile(props: Partial<ProfileProps> = {}): Profile {
  return new Profile({
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
    ...props,
  });
}

describe("GetPublicProfileUseCase", () => {
  it("returns public profile for anyone", async () => {
    const profile = createMockProfile({ isPublic: true });
    const repo = { findByUserId: vi.fn(), findById: vi.fn().mockResolvedValue(profile), update: vi.fn() };
    const useCase = new GetPublicProfileUseCase(repo);

    const result = await useCase.execute({ id: "1" });

    expect(result).toEqual(profile);
  });

  it("returns private profile for owner", async () => {
    const profile = createMockProfile({ isPublic: false, userId: "user-1" });
    const repo = { findByUserId: vi.fn(), findById: vi.fn().mockResolvedValue(profile), update: vi.fn() };
    const useCase = new GetPublicProfileUseCase(repo);

    const result = await useCase.execute({ id: "1", viewerUserId: "user-1" });

    expect(result).toEqual(profile);
  });

  it("throws ProfilePrivateError for non-owner viewing private profile", async () => {
    const profile = createMockProfile({ isPublic: false, userId: "user-1" });
    const repo = { findByUserId: vi.fn(), findById: vi.fn().mockResolvedValue(profile), update: vi.fn() };
    const useCase = new GetPublicProfileUseCase(repo);

    await expect(useCase.execute({ id: "1", viewerUserId: "user-2" })).rejects.toThrow(ProfilePrivateError);
  });

  it("returns null when profile not found", async () => {
    const repo = { findByUserId: vi.fn(), findById: vi.fn().mockResolvedValue(null), update: vi.fn() };
    const useCase = new GetPublicProfileUseCase(repo);

    const result = await useCase.execute({ id: "non-existent" });

    expect(result).toBeNull();
  });
});
