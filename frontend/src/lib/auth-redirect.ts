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
    // Paralelizando a RPC e a query de profiles para evitar a 'tela branca'
    const [adminResult, profileResult] = await Promise.allSettled([
      supabase.rpc("is_admin", { _user_id: userId }),
      supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    const isAdmin = adminResult.status === "fulfilled" && adminResult.value.data === true;
    if (isAdmin) return "/admin";

    const role = profileResult.status === "fulfilled" ? profileResult.value.data?.role : null;
    if (!role) return "/cadastro";

    return roleToDash[role] || "/explorar";
  } catch (err) {
    console.warn("[auth-redirect] Error resolving redirect:", err);
    return "/explorar";
  }
}
