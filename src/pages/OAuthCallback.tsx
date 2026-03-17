import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for auth state to settle
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", session.user.id)
          .single();

        if (!profile?.city) {
          navigate("/onboarding/jogador", { replace: true });
        } else {
          navigate("/dashboard/jogador", { replace: true });
        }
      } else {
        // Listen for session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            subscription.unsubscribe();
            supabase
              .from("profiles")
              .select("city")
              .eq("user_id", session.user.id)
              .single()
              .then(({ data: profile }) => {
                if (!profile?.city) {
                  navigate("/onboarding/jogador", { replace: true });
                } else {
                  navigate("/dashboard/jogador", { replace: true });
                }
              });
          }
        });

        // Timeout fallback
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 10000);
      }
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
