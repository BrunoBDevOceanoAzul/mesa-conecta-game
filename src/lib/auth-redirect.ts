import { supabase } from "@/integrations/supabase/client";

const roleToOnboarding: Record<string, string> = {
  player: "/onboarding/jogador",
  gm: "/onboarding/mestre",
  store: "/onboarding/loja",
  brand: "/onboarding",
};

const roleToDash: Record<string, string> = {
  admin: "/admin",
  player: "/dashboard/jogador",
  gm: "/dashboard/mestre",
  store: "/dashboard/loja",
  brand: "/dashboard/marca",
};

export async function resolveRedirect(userId: string, _fallbackRole?: string): Promise<string> {
  try {
    // Check admin role first
    let isAdmin = false;
    try {
      const { data } = await supabase.rpc("is_admin", { _user_id: userId });
      isAdmin = !!data;
    } catch {
      // RPC might not exist or fail — not critical
    }
    if (isAdmin) return "/admin";

    // Fetch profile — may not exist yet for brand-new users (trigger delay)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, can_play, can_gm")
      .eq("user_id", userId)
      .maybeSingle();

    const role = profile?.role;

    // If no role has been chosen yet, send to onboarding profile selection
    if (!role) {
      return "/onboarding";
    }

    // If onboarding not completed, send to role-specific onboarding
    if (!profile?.onboarding_completed) {
      return roleToOnboarding[role] || "/onboarding";
    }

    return roleToDash[role] || "/onboarding";
  } catch (err) {
    console.warn("[auth-redirect] Error resolving redirect:", err);
    // Safe fallback — send to generic onboarding which will handle role selection
    return "/onboarding";
  }
}
