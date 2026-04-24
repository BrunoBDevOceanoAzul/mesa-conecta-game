import { describe, it, expect } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
  appRole,
  brandProfiles,
  gmProfiles,
  onboardingSessions,
  playerProfiles,
  profiles,
  storeProfiles,
  userRoles,
  userSessions,
} from "./index.js";

describe("Profiles Schema", () => {
  it("auth/profiles schema exposes the first functional database module", () => {
    expect(getTableName(profiles)).toBe("profiles");
    expect(getTableName(userRoles)).toBe("user_roles");
    expect(getTableName(userSessions)).toBe("user_sessions");
    expect(getTableName(onboardingSessions)).toBe("onboarding_sessions");
    expect(getTableName(playerProfiles)).toBe("player_profiles");
    expect(getTableName(gmProfiles)).toBe("gm_profiles");
    expect(getTableName(storeProfiles)).toBe("store_profiles");
    expect(getTableName(brandProfiles)).toBe("brand_profiles");
  });

  it("profiles table keeps the critical identity, permission, and onboarding fields", () => {
    const columns = getTableColumns(profiles);

    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.role).toBeDefined();
    expect(columns.slug).toBeDefined();
    expect(columns.canPlay).toBeDefined();
    expect(columns.canGm).toBeDefined();
    expect(columns.canManageStore).toBeDefined();
    expect(columns.canManageBrand).toBeDefined();
    expect(columns.onboardingCompleted).toBeDefined();
    expect(columns.onboardingStep).toBeDefined();
    expect(columns.deletedAt).toBeDefined();
  });

  it("app_role enum matches the current Supabase role contract", () => {
    expect(appRole.enumValues).toEqual(["admin", "moderator", "user", "advisor"]);
  });
});
