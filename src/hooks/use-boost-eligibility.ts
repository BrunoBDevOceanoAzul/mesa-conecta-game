import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BoostEligibilityStatus =
  | "eligible_with_plan"        // Can boost (has active subscription)
  | "eligible_founder_free"     // Can boost free (founder with remaining grants)
  | "eligible_founder_exhausted" // Founder but monthly grants used up
  | "eligible_founder_expired"  // Was founder but 3-month window ended
  | "no_plan"                   // Eligible role but no active subscription
  | "not_eligible"              // Wrong role (player, brand, not logged in)
  | "loading";

export interface BoostEligibility {
  status: BoostEligibilityStatus;
  canBoost: boolean;
  isFounder: boolean;
  founderRank: number | null;
  founderFreeRemaining: number;
  founderExpiresAt: string | null;
  walletBalance: number;
  hasActivePlan: boolean;
  planName: string | null;
  userRole: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FOUNDER_LIMIT = 10; // First 10 GMs
const FREE_BOOSTS_PER_MONTH = 2;
const FOUNDER_DURATION_MONTHS = 3;

export function useBoostEligibility(): BoostEligibility {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<BoostEligibility, "refresh">>({
    status: "loading",
    canBoost: false,
    isFounder: false,
    founderRank: null,
    founderFreeRemaining: 0,
    founderExpiresAt: null,
    walletBalance: 0,
    hasActivePlan: false,
    planName: null,
    userRole: null,
    loading: true,
  });

  const fetchEligibility = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, status: "not_eligible", loading: false }));
      return;
    }

    // Fetch profile, subscription, and wallet in parallel
    const [profileRes, subRes, walletRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("credit_wallets").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const role = profileRes.data?.role;
    const isGmOrStore = role === "gm" || role === "store";

    if (!isGmOrStore) {
      setState((s) => ({
        ...s,
        status: "not_eligible",
        canBoost: false,
        userRole: role || null,
        loading: false,
      }));
      return;
    }

    const subscription = subRes.data;
    const hasActivePlan = !!subscription && new Date(subscription.current_period_end) > new Date();
    const wallet = walletRes.data;

    // Check founder status (only for GMs)
    const isFounder = role === "gm" && !!wallet?.is_founder;
    const founderRank = wallet?.founder_rank || null;
    const founderExpiresAt = wallet?.founder_expires_at || null;
    const now = new Date();

    let founderFreeRemaining = 0;
    let founderActive = false;

    if (isFounder && founderExpiresAt && new Date(founderExpiresAt) > now) {
      founderActive = true;
      // Check if month needs reset
      const lastReset = wallet?.last_month_reset ? new Date(wallet.last_month_reset) : null;
      const needsReset = !lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();

      if (needsReset && wallet) {
        // Reset monthly counter
        await supabase.from("credit_wallets").update({
          free_boosts_used_current_month: 0,
          last_month_reset: now.toISOString(),
        }).eq("user_id", user.id);
        founderFreeRemaining = FREE_BOOSTS_PER_MONTH;
      } else {
        founderFreeRemaining = Math.max(0, FREE_BOOSTS_PER_MONTH - (wallet?.free_boosts_used_current_month || 0));
      }
    }

    // Determine status
    let status: BoostEligibilityStatus;
    let canBoost = false;

    if (!hasActivePlan) {
      status = "no_plan";
    } else if (isFounder && founderActive && founderFreeRemaining > 0) {
      status = "eligible_founder_free";
      canBoost = true;
    } else if (isFounder && founderActive && founderFreeRemaining === 0) {
      status = "eligible_founder_exhausted";
      canBoost = true; // Can still boost with credits
    } else if (isFounder && !founderActive) {
      status = "eligible_founder_expired";
      canBoost = true; // Can still boost with credits
    } else {
      status = "eligible_with_plan";
      canBoost = true;
    }

    setState({
      status,
      canBoost,
      isFounder,
      founderRank,
      founderFreeRemaining,
      founderExpiresAt,
      walletBalance: wallet?.balance || 0,
      hasActivePlan,
      planName: subscription?.plan_name || null,
      userRole: role,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  return { ...state, refresh: fetchEligibility };
}
