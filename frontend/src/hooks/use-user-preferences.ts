import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { UserPreferences } from "@/lib/match-scoring";

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("city, preferred_systems, play_styles, preferred_format, budget_range")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setPreferences(data as UserPreferences | null);
        setLoading(false);
      });
  }, [user]);

  return { preferences, loading };
}
