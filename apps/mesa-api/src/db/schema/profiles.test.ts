import assert from "node:assert/strict";
import { test } from "node:test";

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

test("auth/profiles schema exposes the first functional database module", () => {
  assert.equal(getTableName(profiles), "profiles");
  assert.equal(getTableName(userRoles), "user_roles");
  assert.equal(getTableName(userSessions), "user_sessions");
  assert.equal(getTableName(onboardingSessions), "onboarding_sessions");
  assert.equal(getTableName(playerProfiles), "player_profiles");
  assert.equal(getTableName(gmProfiles), "gm_profiles");
  assert.equal(getTableName(storeProfiles), "store_profiles");
  assert.equal(getTableName(brandProfiles), "brand_profiles");
});

test("profiles table keeps the critical identity, permission, and onboarding fields", () => {
  const columns = getTableColumns(profiles);

  assert.ok(columns.id);
  assert.ok(columns.userId);
  assert.ok(columns.email);
  assert.ok(columns.role);
  assert.ok(columns.slug);
  assert.ok(columns.canPlay);
  assert.ok(columns.canGm);
  assert.ok(columns.canManageStore);
  assert.ok(columns.canManageBrand);
  assert.ok(columns.onboardingCompleted);
  assert.ok(columns.onboardingStep);
  assert.ok(columns.deletedAt);
});

test("app_role enum matches the current Supabase role contract", () => {
  assert.deepEqual(appRole.enumValues, ["admin", "moderator", "user", "advisor"]);
});
