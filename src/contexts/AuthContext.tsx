import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const roleToDash: Record<string, string> = {
  player: "/dashboard/jogador",
  gm: "/dashboard/mestre",
  store: "/dashboard/loja",
  brand: "/dashboard/marca",
};

const roleToOnboarding: Record<string, string> = {
  player: "/onboarding/jogador",
  gm: "/onboarding/mestre",
  store: "/onboarding/loja",
  brand: "/onboarding",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle email confirmation redirect
        if (event === "SIGNED_IN" && session?.user) {
          const currentPath = window.location.pathname;
          // Only redirect if user is on a public/landing page (not already in app)
          const isPublicPage = ["/", "/login", "/cadastro", "/reset-password", "/~oauth"].includes(currentPath);
          
          if (isPublicPage) {
            const role = session.user.user_metadata?.role || "player";
            // Check if user has completed onboarding (has city set)
            const { data: profile } = await supabase
              .from("profiles")
              .select("city")
              .eq("user_id", session.user.id)
              .maybeSingle();

            if (profile?.city) {
              window.location.href = roleToDash[role] || "/dashboard/jogador";
            } else {
              window.location.href = roleToOnboarding[role] || "/onboarding/jogador";
            }
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
