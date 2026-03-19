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

export async function resolveRedirect(userId: string, fallbackRole?: string): Promise<string> {
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
      .select("city, role, onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle();

    const role = profile?.role || fallbackRole || "player";

    // If onboarding not completed or no city, send to onboarding
    if (!profile?.onboarding_completed) {
      return roleToOnboarding[role] || "/onboarding/jogador";
    }

    return roleToDash[role] || "/dashboard/jogador";
  } catch (err) {
    console.warn("[auth-redirect] Error resolving redirect:", err);
    // Safe fallback — send to onboarding which will handle profile loading
    return roleToOnboarding[fallbackRole || "player"] || "/onboarding/jogador";
  }
}
