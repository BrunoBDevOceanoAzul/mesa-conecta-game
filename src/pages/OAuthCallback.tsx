import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveRedirect } from "@/lib/auth-redirect";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      try {
        // Try getSession with retry for transient 500/504 errors
        let session = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session) {
            session = data.session;
            break;
          }
          if (error) {
            console.warn(`[OAuthCallback] getSession attempt ${attempt + 1} error:`, error.message);
          }
          if (attempt < 2) {
            setStatus("Conectando...");
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          }
        }

        if (session?.user) {
          setStatus("Preparando seu perfil...");
          await new Promise((r) => setTimeout(r, 1000));
          const dest = await resolveRedirect(session.user.id);
          navigate(dest, { replace: true });
          return;
        }

        // If no session yet, listen for the auth state change
        setStatus("Aguardando autenticação...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              subscription.unsubscribe();
              setStatus("Preparando seu perfil...");
              await new Promise((r) => setTimeout(r, 1000));
              try {
                const dest = await resolveRedirect(session.user.id);
                navigate(dest, { replace: true });
              } catch {
                navigate("/onboarding", { replace: true });
              }
            }
          }
        );

        setTimeout(() => {
          subscription.unsubscribe();
          navigate("/login", { replace: true });
        }, 20_000);
      } catch (err) {
        console.warn("[OAuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    run();
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
