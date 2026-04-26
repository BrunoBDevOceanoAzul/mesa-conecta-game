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
  const initialized = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Only update state, avoid async calls in the listener to prevent deadlocks
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN" && newSession?.user) {
          const provider = newSession.user.app_metadata?.provider || "email";
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            trackSignIn(newSession.user.id, provider);
          }, 0);

          if (lastSeenInterval.current) clearInterval(lastSeenInterval.current);
          lastSeenInterval.current = setInterval(() => {
            updateLastSeen(newSession.user.id);
          }, 5 * 60 * 1000);
        }

        if (event === "SIGNED_OUT") {
          if (lastSeenInterval.current) {
            clearInterval(lastSeenInterval.current);
            lastSeenInterval.current = null;
          }
        }

        if (event === "TOKEN_REFRESHED" && newSession?.user) {
          // Session refreshed successfully — ensure heartbeat is running
          if (!lastSeenInterval.current) {
            lastSeenInterval.current = setInterval(() => {
              updateLastSeen(newSession.user.id);
            }, 5 * 60 * 1000);
          }
        }
      }
    );

    // Then get the initial session — with timeout para evitar loading travado
    const getSessionWithTimeout = () =>
      Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout getting session")), 5000)
        ),
      ]) as ReturnType<typeof supabase.auth.getSession>;

    getSessionWithTimeout()
      .then(({ data: { session: initSession }, error }) => {
        if (error) {
          console.warn("[Auth] getSession error:", error.message);
        }
        if (!initialized.current) {
          setSession(initSession);
          setUser(initSession?.user ?? null);
          setLoading(false);
          initialized.current = true;

          if (initSession?.user) {
            lastSeenInterval.current = setInterval(() => {
              updateLastSeen(initSession.user.id);
            }, 5 * 60 * 1000);
          }
        }
      })
      .catch((err) => {
        console.warn("[Auth] getSession timeout or error:", err?.message);
        if (!initialized.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initialized.current = true;
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
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
