import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrialStatus {
  inTrial: boolean;
  trialEndsAt: string | null;
  daysRemaining: number;
  loading: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const [state, setState] = useState<TrialStatus>({
    inTrial: false,
    trialEndsAt: null,
    daysRemaining: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    supabase
      .rpc("get_trial_status", { _user_id: user.id })
      .then(({ data, error }) => {
        if (error || !data) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        const d = data as { in_trial: boolean; trial_ends_at: string; days_remaining: number };
        setState({
          inTrial: d.in_trial,
          trialEndsAt: d.trial_ends_at,
          daysRemaining: d.days_remaining,
          loading: false,
        });
      });
  }, [user?.id]);

  return state;
}
