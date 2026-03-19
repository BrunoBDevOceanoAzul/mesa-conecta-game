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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSeenInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN" && session?.user) {
          const provider = session.user.app_metadata?.provider || "email";
          trackSignIn(session.user.id, provider);

          // Start heartbeat
          if (lastSeenInterval.current) clearInterval(lastSeenInterval.current);
          lastSeenInterval.current = setInterval(() => {
            updateLastSeen(session.user.id);
          }, 5 * 60 * 1000);
        }

        if (event === "SIGNED_OUT") {
          if (lastSeenInterval.current) {
            clearInterval(lastSeenInterval.current);
            lastSeenInterval.current = null;
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        lastSeenInterval.current = setInterval(() => {
          updateLastSeen(session.user.id);
        }, 5 * 60 * 1000);
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
