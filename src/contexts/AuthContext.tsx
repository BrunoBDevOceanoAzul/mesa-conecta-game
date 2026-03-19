import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackSignIn, trackSignOut, updateLastSeen } from "@/lib/session-tracker";
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
  admin: "/admin",
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
  const lastSeenInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Track sign-in session
        if (event === "SIGNED_IN" && session?.user) {
          const provider = session.user.app_metadata?.provider || "email";
          trackSignIn(session.user.id, provider);

          const currentPath = window.location.pathname;
          const isPublicPage = ["/", "/login", "/cadastro", "/reset-password", "/~oauth"].includes(currentPath);
          
          if (isPublicPage) {
            // Check admin role first
            const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: session.user.id });
            
            if (isAdmin) {
              window.location.href = "/admin";
              return;
            }

            const role = session.user.user_metadata?.role || "player";
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

        // Track sign-out
        if (event === "SIGNED_OUT") {
          if (lastSeenInterval.current) {
            clearInterval(lastSeenInterval.current);
            lastSeenInterval.current = null;
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Start last_seen heartbeat for existing sessions
      if (session?.user) {
        lastSeenInterval.current = setInterval(() => {
          updateLastSeen(session.user.id);
        }, 5 * 60 * 1000); // every 5 min
      }
    });

    return () => {
      subscription.unsubscribe();
      if (lastSeenInterval.current) clearInterval(lastSeenInterval.current);
    };
  }, []);

  const signOut = async () => {
    if (user) await trackSignOut(user.id);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
