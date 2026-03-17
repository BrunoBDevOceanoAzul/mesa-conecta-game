import { useMasterProgression } from "@/hooks/use-master-progression";
import { useXpConfig } from "@/hooks/use-xp-config";
import { Gift, Sparkles, Zap } from "lucide-react";
import { useMemo } from "react";

import { XpOverviewCard } from "./progression/XpOverviewCard";
import { TierRoadmap } from "./progression/TierRoadmap";
import { BadgeCard } from "./progression/BadgeCard";
import { MissionsPanel } from "./progression/MissionsPanel";
import { XpActionsReference } from "./progression/XpActionsReference";

export function ProgressionPanel() {
  const prog = useMasterProgression();
  const { tiers } = useXpConfig();

  const completedActions = useMemo(() => {
    return new Set(prog.recentEvents.map((e) => e.action_type));
  }, [prog.recentEvents]);

  if (prog.loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const nextTier = tiers.find((t) => t.level === prog.tier.level + 1);

  return (
    <div className="space-y-6">
      <XpOverviewCard prog={prog} nextTier={nextTier} />
      
      <MissionsPanel completedActions={completedActions} />

      <TierRoadmap tiers={tiers} currentLevel={prog.tier.level} />

      {/* Founder Badges */}
      {prog.founderBadges.length > 0 && (
        <div className="rounded-xl border border-secondary/20 bg-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="h-4 w-4 text-secondary" /> Badges Founder
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {prog.founderBadges.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </div>
      )}

      {/* All Badges */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Badges Conquistados
        </h3>
        {prog.badges.filter((b) => !b.is_founder_badge).length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum badge conquistado ainda.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Continue jogando para desbloquear conquistas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {prog.badges.filter((b) => !b.is_founder_badge).map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        )}
      </div>

      <XpActionsReference />

      {/* Recent XP Events */}
      {prog.recentEvents.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" /> Histórico de XP
          </h3>
          <div className="space-y-2">
            {prog.recentEvents.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-foreground">{e.action_type.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary">+{e.xp_amount} XP</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
