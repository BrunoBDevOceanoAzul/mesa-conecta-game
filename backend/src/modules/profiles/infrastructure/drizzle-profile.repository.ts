import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { profiles, userRoles, playerProfiles, gmProfiles } from "../../../db/schema/profiles.js";
import { mesas } from "../../../db/schema/mesas.js";
import { Profile } from "../domain/profile.js";
import { ProfileRepository, FindProfileByUserIdInput, FindProfileByIdInput, UpdateProfileInput } from "../domain/profile-repository.js";

export class DrizzleProfileRepository implements ProfileRepository {
  async findByUserId(input: FindProfileByUserIdInput): Promise<Profile | null> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, input.userId))
      .limit(1);

    if (!profile) return null;

    const roles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, input.userId));

    const [gmStats] = await db
      .select({
        totalMesas: sql<number>`count(*)::int`,
        totalBookings: sql<number>`COALESCE(SUM(${mesas.seatsTotal} - ${mesas.seatsAvailable}), 0)::int`,
      })
      .from(mesas)
      .where(eq(mesas.gmId, input.userId));

    const [playerProfile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, input.userId))
      .limit(1);

    const [gmProfile] = await db
      .select()
      .from(gmProfiles)
      .where(eq(gmProfiles.userId, input.userId))
      .limit(1);

    return new Profile({
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      displayName: profile.displayName,
      email: profile.email,
      slug: profile.slug,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      instagramHandle: profile.instagramHandle,
      websiteUrl: profile.websiteUrl,
      role: profile.role,
      roles: roles.map((r) => r.role),
      isPublic: profile.isPublic ?? true,
      capabilities: {
        canPlay: profile.canPlay,
        canGm: profile.canGm,
        canManageStore: profile.canManageStore,
        canManageBrand: profile.canManageBrand,
      },
      preferences: {
        preferredSystems: profile.preferredSystems ?? [],
        playStyles: profile.playStyles ?? [],
        experienceLevel: profile.experienceLevel,
        preferredFormat: profile.preferredFormat,
        budgetRange: profile.budgetRange,
      },
      onboarding: {
        completed: profile.onboardingCompleted ?? false,
        step: profile.onboardingStep ?? 0,
      },
      stats: {
        gm: {
          totalMesas: gmStats?.totalMesas || 0,
          totalBookings: gmStats?.totalBookings || 0,
          averageRating: gmProfile?.averageRating || "0",
          totalReviews: gmProfile?.totalReviews || 0,
          reputationScore: gmProfile?.reputationScore || "0",
        },
        player: {
          totalBookings: 0,
          totalReviews: 0,
        },
        memberSince: profile.createdAt,
        lastLoginAt: profile.lastLoginAt,
      },
      playerProfile: playerProfile || null,
      gmProfile: gmProfile || null,
    });
  }

  async findById(input: FindProfileByIdInput): Promise<Profile | null> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, input.id))
      .limit(1);

    if (!profile) return null;

    const [gmProfile] = await db
      .select()
      .from(gmProfiles)
      .where(eq(gmProfiles.userId, profile.userId))
      .limit(1);

    return new Profile({
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      displayName: profile.displayName,
      email: profile.email,
      slug: profile.slug,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      instagramHandle: profile.instagramHandle,
      websiteUrl: profile.websiteUrl,
      role: profile.role,
      roles: [],
      isPublic: profile.isPublic ?? true,
      capabilities: {
        canPlay: profile.canPlay,
        canGm: profile.canGm,
        canManageStore: profile.canManageStore,
        canManageBrand: profile.canManageBrand,
      },
      preferences: {
        preferredSystems: profile.preferredSystems ?? [],
        playStyles: profile.playStyles ?? [],
        experienceLevel: profile.experienceLevel,
        preferredFormat: profile.preferredFormat,
        budgetRange: profile.budgetRange,
      },
      onboarding: {
        completed: profile.onboardingCompleted ?? false,
        step: profile.onboardingStep ?? 0,
      },
      stats: {
        gm: {
          totalMesas: 0,
          totalBookings: 0,
          averageRating: gmProfile?.averageRating || "0",
          totalReviews: gmProfile?.totalReviews || 0,
          reputationScore: gmProfile?.reputationScore || "0",
        },
        player: {
          totalBookings: 0,
          totalReviews: 0,
        },
        memberSince: profile.createdAt,
        lastLoginAt: profile.lastLoginAt,
      },
      playerProfile: null,
      gmProfile: gmProfile || null,
    });
  }

  async update(input: UpdateProfileInput): Promise<Profile | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.displayName !== undefined) updateValues.displayName = input.displayName;
    if (input.bio !== undefined) updateValues.bio = input.bio;
    if (input.city !== undefined) updateValues.city = input.city;
    if (input.state !== undefined) updateValues.state = input.state;
    if (input.phone !== undefined) updateValues.phone = input.phone;
    if (input.whatsapp !== undefined) updateValues.whatsapp = input.whatsapp;
    if (input.instagramHandle !== undefined) updateValues.instagramHandle = input.instagramHandle;
    if (input.websiteUrl !== undefined) updateValues.websiteUrl = input.websiteUrl;
    if (input.avatarUrl !== undefined) updateValues.avatarUrl = input.avatarUrl;
    if (input.coverImageUrl !== undefined) updateValues.coverImageUrl = input.coverImageUrl;
    if (input.preferredSystems !== undefined) updateValues.preferredSystems = input.preferredSystems;
    if (input.playStyles !== undefined) updateValues.playStyles = input.playStyles;
    if (input.experienceLevel !== undefined) updateValues.experienceLevel = input.experienceLevel;
    if (input.preferredFormat !== undefined) updateValues.preferredFormat = input.preferredFormat;
    if (input.canPlay !== undefined) updateValues.canPlay = input.canPlay;
    if (input.canGm !== undefined) updateValues.canGm = input.canGm;
    if (input.canManageStore !== undefined) updateValues.canManageStore = input.canManageStore;
    if (input.canManageBrand !== undefined) updateValues.canManageBrand = input.canManageBrand;

    const [updated] = await db
      .update(profiles)
      .set(updateValues)
      .where(eq(profiles.userId, input.userId))
      .returning();

    if (!updated) return null;

    return new Profile({
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      displayName: updated.displayName,
      email: updated.email,
      slug: updated.slug,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      coverImageUrl: updated.coverImageUrl,
      city: updated.city,
      state: updated.state,
      country: updated.country,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      instagramHandle: updated.instagramHandle,
      websiteUrl: updated.websiteUrl,
      role: updated.role,
      roles: [],
      isPublic: updated.isPublic ?? true,
      capabilities: {
        canPlay: updated.canPlay,
        canGm: updated.canGm,
        canManageStore: updated.canManageStore,
        canManageBrand: updated.canManageBrand,
      },
      preferences: {
        preferredSystems: updated.preferredSystems ?? [],
        playStyles: updated.playStyles ?? [],
        experienceLevel: updated.experienceLevel,
        preferredFormat: updated.preferredFormat,
        budgetRange: updated.budgetRange,
      },
      onboarding: {
        completed: updated.onboardingCompleted ?? false,
        step: updated.onboardingStep ?? 0,
      },
      stats: {
        gm: { totalMesas: 0, totalBookings: 0, averageRating: "0", totalReviews: 0, reputationScore: "0" },
        player: { totalBookings: 0, totalReviews: 0 },
        memberSince: updated.createdAt,
        lastLoginAt: updated.lastLoginAt,
      },
      playerProfile: null,
      gmProfile: null,
    });
  }
}
