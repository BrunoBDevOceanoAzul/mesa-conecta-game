import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  XP_TIERS as DEFAULT_TIERS,
  XP_ACTIONS as DEFAULT_ACTIONS,
  type XpTier,
  type XpAction,
} from "@/lib/xp-config";

/**
 * Loads XP tiers and actions from admin_settings (if configured),
 * falling back to hardcoded defaults.
 */
export function useXpConfig() {
  const [tiers, setTiers] = useState<XpTier[]>(DEFAULT_TIERS);
  const [actions, setActions] = useState<XpAction[]>(DEFAULT_ACTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tiersRes, actionsRes] = await Promise.all([
        supabase.from("admin_settings").select("value").eq("key", "xp_tiers").maybeSingle(),
        supabase.from("admin_settings").select("value").eq("key", "xp_actions").maybeSingle(),
      ]);

      const rawTiers = tiersRes.data?.value;
      if (Array.isArray(rawTiers) && rawTiers.length > 0) {
        setTiers(
          rawTiers.map((t: any) => ({
            level: t.level,
            title: t.title,
            minXp: t.minXp,
            maxXp: t.maxXp === "Infinity" || t.maxXp === null ? Infinity : Number(t.maxXp),
            description: t.description || "",
          }))
        );
      }

      const rawActions = actionsRes.data?.value;
      if (Array.isArray(rawActions) && rawActions.length > 0) {
        setActions(
          rawActions.map((a: any) => ({
            type: a.type,
            label: a.label,
            xp: a.xp,
            description: a.description || "",
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  function getTierForXp(xp: number): XpTier {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (xp >= tiers[i].minXp) return tiers[i];
    }
    return tiers[0];
  }

  function getXpProgress(xp: number) {
    const tier = getTierForXp(xp);
    const nextTier = tiers.find((t) => t.level === tier.level + 1);
    if (!nextTier) return { current: xp, needed: xp, percent: 100 };
    const inTier = xp - tier.minXp;
    const tierRange = nextTier.minXp - tier.minXp;
    return { current: inTier, needed: tierRange, percent: Math.min(100, Math.round((inTier / tierRange) * 100)) };
  }

  function getXpActionAmount(actionType: string): number {
    return actions.find((a) => a.type === actionType)?.xp || 0;
  }

  return { tiers, actions, loading, getTierForXp, getXpProgress, getXpActionAmount };
}
