import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveRedirect } from "@/lib/auth-redirect";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      // Wait for Supabase to exchange tokens from URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.user) {
        const dest = await resolveRedirect(session.user.id, session.user.user_metadata?.role);
        navigate(dest, { replace: true });
        return;
      }

      // If no session yet, listen for the auth state change (token exchange in progress)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            subscription.unsubscribe();
            const dest = await resolveRedirect(session.user.id, session.user.user_metadata?.role);
            navigate(dest, { replace: true });
          }
        }
      );

      // Timeout → back to login
      setTimeout(() => {
        subscription.unsubscribe();
        navigate("/login", { replace: true });
      }, 10_000);
    };

    run();
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
