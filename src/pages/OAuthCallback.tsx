import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveRedirect } from "@/lib/auth-redirect";
import { Loader2 } from "lucide-react";

/** If user came from a role-specific signup, apply that role to their profile */
async function applySignupRoleAndRedirect(userId: string): Promise<string> {
  const raw = sessionStorage.getItem("hivium_signup_role");
  if (raw) {
    sessionStorage.removeItem("hivium_signup_role");
    try {
      const { role, canPlay, canGm, canManageStore, onboardingPath } = JSON.parse(raw);
      await supabase.from("profiles").update({
        role,
        can_play: canPlay,
        can_gm: canGm,
        can_manage_store: canManageStore,
      } as any).eq("user_id", userId);
      return onboardingPath;
    } catch {
      // Fall through to normal redirect
    }
  }
  return resolveRedirect(userId);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let subscriptionRef: { unsubscribe: () => void } | null = null;

    const finish = async (userId: string) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscriptionRef) subscriptionRef.unsubscribe();

      setStatus("Preparando seu perfil...");
      await new Promise((r) => setTimeout(r, 800));

      try {
        const dest = await applySignupRoleAndRedirect(userId);
        navigate(dest, { replace: true });
      } catch {
        navigate("/onboarding", { replace: true });
      }
    };

    const run = async () => {
      try {
        setStatus("Validando sessão...");

        // Retry session read to handle transient auth latency
        for (let attempt = 0; attempt < 4; attempt++) {
          const { data, error } = await supabase.auth.getSession();
          if (data.session?.user) {
            await finish(data.session.user.id);
            return;
          }
          if (error) {
            console.warn(`[OAuthCallback] getSession attempt ${attempt + 1} error:`, error.message);
          }
          if (attempt < 3) {
            setStatus("Conectando...");
            await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
          }
        }

        // Fallback: user may already be available even when session is delayed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await finish(user.id);
          return;
        }

        // Listen for delayed auth events
        setStatus("Aguardando autenticação...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (
              session?.user &&
              (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")
            ) {
              await finish(session.user.id);
            }
          }
        );
        subscriptionRef = subscription;

        timeoutId = setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            await finish(data.session.user.id);
            return;
          }
          navigate("/login", { replace: true });
        }, 30_000);
      } catch (err) {
        console.warn("[OAuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    run();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (subscriptionRef) subscriptionRef.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
