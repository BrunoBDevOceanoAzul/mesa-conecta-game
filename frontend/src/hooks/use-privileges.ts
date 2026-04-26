import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * HIVIUM Privilege Hierarchy (highest → lowest):
 *
 *  1. admin      — Full platform control, can view/test everything
 *  2. advisor    — Same visibility as admin (read + test), no destructive writes
 *  3. brand      — Brand dashboard access
 *  4. store      — Store dashboard, agenda, boost
 *  5. gm         — GM dashboard, agenda, boost, mesa management
 *  6. player     — Player dashboard, explore, feed
 *
 * Admin and Advisor ALWAYS bypass route guards and premium gates.
 */

export type PlatformRole = "admin" | "advisor" | "brand" | "store" | "gm" | "player";

export interface Privileges {
  /** Primary profile role from profiles table */
  profileRole: string | null;
  /** Elevated roles from user_roles table (admin, advisor) */
  elevatedRoles: string[];
  /** All effective roles (profile + capabilities + elevated) */
  effectiveRoles: string[];
  /** User is admin */
  isAdmin: boolean;
  /** User is advisor (conselheiro) */
  isAdvisor: boolean;
  /** User has elevated access (admin OR advisor) — bypasses all gates */
  isSuperUser: boolean;
  /** Capability flags */
  canPlay: boolean;
  canGm: boolean;
  canManageStore: boolean;
  canManageBrand: boolean;
  /** Check if user can access a route that requires specific roles */
  hasAccess: (allowedRoles: string[]) => boolean;
  /** Loading state */
  loading: boolean;
}

export function usePrivileges(): Privileges {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [elevatedRoles, setElevatedRoles] = useState<string[]>([]);
  const [canPlay, setCanPlay] = useState(false);
  const [canGm, setCanGm] = useState(false);
  const [canManageStore, setCanManageStore] = useState(false);
  const [canManageBrand, setCanManageBrand] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("role, can_play, can_gm, can_manage_store, can_manage_brand")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id),
        ]);

        if (cancelled) return;

        const profile = profileRes.data as any;
        setProfileRole(profile?.role || null);
        setCanPlay(!!profile?.can_play);
        setCanGm(!!profile?.can_gm);
        setCanManageStore(!!profile?.can_manage_store);
        setCanManageBrand(!!profile?.can_manage_brand);

        const elevated = (rolesRes.data || []).map((r: any) => r.role as string);
        setElevatedRoles(elevated);
      } catch (err) {
        console.warn("[usePrivileges] Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isAdmin = elevatedRoles.includes("admin");
  const isAdvisor = elevatedRoles.includes("advisor");
  const isSuperUser = isAdmin || isAdvisor;

  // Build effective roles list
  const effectiveRoles: string[] = [];
  if (profileRole) effectiveRoles.push(profileRole);
  if (canPlay && !effectiveRoles.includes("player")) effectiveRoles.push("player");
  if (canGm && !effectiveRoles.includes("gm")) effectiveRoles.push("gm");
  if (canManageStore && !effectiveRoles.includes("store")) effectiveRoles.push("store");
  if (canManageBrand && !effectiveRoles.includes("brand")) effectiveRoles.push("brand");
  for (const r of elevatedRoles) {
    if (!effectiveRoles.includes(r)) effectiveRoles.push(r);
  }

  const hasAccess = (allowedRoles: string[]): boolean => {
    // Super users bypass everything
    if (isSuperUser) return true;
    return effectiveRoles.some((r) => allowedRoles.includes(r));
  };

  return {
    profileRole,
    elevatedRoles,
    effectiveRoles,
    isAdmin,
    isAdvisor,
    isSuperUser,
    canPlay,
    canGm,
    canManageStore,
    canManageBrand,
    hasAccess,
    loading,
  };
}
