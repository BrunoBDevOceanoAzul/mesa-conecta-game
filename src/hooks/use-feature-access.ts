import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeatureKey =
  | "applications_per_month"
  | "active_mesas"
  | "crm_access"
  | "studio_access"
  | "analytics_access"
  | "cart_abandonment"
  | "boost_campaigns";

export interface FeatureAccessResult {
  allowed: boolean;
  usage: number;
  limit: number;
  remaining: number;
}

/**
 * Hook to check and track feature usage against plan limits.
 * Uses the backend `check_feature_access` RPC for real enforcement.
 */
export function useFeatureAccess() {
  const checkAccess = useCallback(async (
    featureKey: FeatureKey,
    increment = false
  ): Promise<FeatureAccessResult> => {
    try {
      const { data, error } = await supabase.rpc("check_feature_access", {
        _feature_key: featureKey,
        _increment: increment,
      });

      if (error) {
        console.warn("[useFeatureAccess] RPC error:", error.message);
        // Fail open for now — allow action but log
        return { allowed: true, usage: 0, limit: -1, remaining: -1 };
      }

      return data as FeatureAccessResult;
    } catch (err) {
      console.warn("[useFeatureAccess] Unexpected error:", err);
      return { allowed: true, usage: 0, limit: -1, remaining: -1 };
    }
  }, []);

  return { checkAccess };
}
