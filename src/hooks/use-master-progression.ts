import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useXpConfig } from "@/hooks/use-xp-config";
import type { XpTier } from "@/lib/xp-config";

export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  flavor_text: string | null;
  rarity: string;
  category: string;
  icon_key: string | null;
  xp_reward: number;
}

export interface AwardedBadge {
  id: string;
  badge_definition_id: string;
  awarded_reason: string | null;
  awarded_at: string;
  is_founder_badge: boolean;
  definition?: BadgeDefinition;
}

export interface XpEvent {
  id: string;
  action_type: string;
  xp_amount: number;
  reference_type: string | null;
  created_at: string;
}

export interface MasterProgressionState {
  loading: boolean;
  totalXp: number;
  level: number;
  title: string;
  tier: XpTier;
  progress: { current: number; needed: number; percent: number };
  badges: AwardedBadge[];
  founderBadges: AwardedBadge[];
  recentEvents: XpEvent[];
  allDefinitions: BadgeDefinition[];
  refresh: () => Promise<void>;
  addXp: (actionType: string, referenceType?: string, referenceId?: string) => Promise<boolean>;
}

export function useMasterProgression(): MasterProgressionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState("Iniciante");
  const [badges, setBadges] = useState<AwardedBadge[]>([]);
  const [recentEvents, setRecentEvents] = useState<XpEvent[]>([]);
  const [allDefinitions, setAllDefinitions] = useState<BadgeDefinition[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [xpRes, badgesRes, eventsRes, defsRes] = await Promise.all([
      supabase.from("master_xp_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("master_badges").select("*").eq("user_id", user.id).order("awarded_at", { ascending: false }),
      supabase.from("xp_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("badge_definitions").select("*").order("created_at"),
    ]);

    const defs = (defsRes.data || []) as unknown as BadgeDefinition[];
    setAllDefinitions(defs);

    const xpProfile = xpRes.data;
    if (xpProfile) {
      setTotalXp(xpProfile.total_xp);
      setLevel(xpProfile.current_level);
      setTitle(xpProfile.current_title);
    } else {
      // Auto-create XP profile for GM
      await supabase.from("master_xp_profiles").insert({ user_id: user.id });
    }

    const awarded = ((badgesRes.data || []) as unknown as AwardedBadge[]).map((b) => ({
      ...b,
      definition: defs.find((d) => d.id === b.badge_definition_id),
    }));
    setBadges(awarded);
    setRecentEvents((eventsRes.data || []) as unknown as XpEvent[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addXp = useCallback(async (actionType: string, referenceType?: string, referenceId?: string): Promise<boolean> => {
    if (!user) return false;
    const amount = getXpActionAmount(actionType);
    if (amount <= 0) return false;

    // Insert XP event
    await supabase.from("xp_events").insert({
      user_id: user.id,
      action_type: actionType,
      xp_amount: amount,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
    });

    // Update XP profile
    const newTotal = totalXp + amount;
    const newTier = getTierForXp(newTotal);

    await supabase.from("master_xp_profiles").update({
      total_xp: newTotal,
      current_level: newTier.level,
      current_title: newTier.title,
    }).eq("user_id", user.id);

    await fetchData();
    return true;
  }, [user, totalXp, fetchData]);

  const tier = getTierForXp(totalXp);
  const progress = getXpProgress(totalXp);
  const founderBadges = badges.filter((b) => b.is_founder_badge);

  return {
    loading,
    totalXp,
    level,
    title,
    tier,
    progress,
    badges,
    founderBadges,
    recentEvents,
    allDefinitions,
    refresh: fetchData,
    addXp,
  };
}
