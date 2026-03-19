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
  const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
  if (isAdmin) return "/admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("city, role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = profile?.role || fallbackRole || "player";

  if (!profile?.city) {
    return roleToOnboarding[role] || "/onboarding/jogador";
  }
  return roleToDash[role] || "/dashboard/jogador";
}
