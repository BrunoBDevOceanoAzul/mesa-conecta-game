import { supabase } from "@/integrations/supabase/client";

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

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, can_play, can_gm")
      .eq("user_id", userId)
      .maybeSingle();

    const role = profile?.role;

    // No role yet → send to signup to pick one
    if (!role) {
      return "/cadastro";
    }

    // Go directly to dashboard — no more mandatory onboarding gate
    return roleToDash[role] || "/explorar";
  } catch (err) {
    console.warn("[auth-redirect] Error resolving redirect:", err);
    return "/explorar";
  }
}
