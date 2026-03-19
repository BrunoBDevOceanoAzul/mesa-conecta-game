import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const roleToOnboarding: Record<string, string> = {
  player: "/onboarding/jogador",
  gm: "/onboarding/mestre",
  store: "/onboarding/loja",
  brand: "/onboarding",
};

const roleToDash: Record<string, string> = {
  player: "/dashboard/jogador",
  gm: "/dashboard/mestre",
  store: "/dashboard/loja",
  brand: "/dashboard/marca",
};

async function resolveRedirect(userId: string, fallbackRole: string): Promise<string> {
  // Check admin first
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

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      // First try existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const dest = await resolveRedirect(
          session.user.id,
          session.user.user_metadata?.role
        );
        navigate(dest, { replace: true });
        return;
      }

      // Wait for auth state change (e.g. token exchange in progress)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            subscription.unsubscribe();
            const dest = await resolveRedirect(
              session.user.id,
              session.user.user_metadata?.role
            );
            navigate(dest, { replace: true });
          }
        }
      );

      // Timeout fallback
      setTimeout(() => {
        subscription.unsubscribe();
        navigate("/login", { replace: true });
      }, 10000);
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  );
}
