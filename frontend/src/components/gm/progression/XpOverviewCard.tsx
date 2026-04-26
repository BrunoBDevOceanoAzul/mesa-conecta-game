import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import type { MasterProgressionState } from "@/hooks/use-master-progression";
import type { XpTier } from "@/lib/xp-config";

interface Props {
  prog: MasterProgressionState;
  nextTier: XpTier | undefined;
}

export function XpOverviewCard({ prog, nextTier }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
              <Trophy className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-overline text-primary">Nível {prog.level}</p>
              <h3 className="text-xl font-display font-bold text-foreground">{prog.title}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-foreground">{prog.totalXp}</p>
            <p className="text-xs text-muted-foreground">XP total</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{prog.tier.title}</span>
            {nextTier && <span className="text-muted-foreground">{nextTier.title}</span>}
          </div>
          <Progress value={prog.progress.percent} className="h-3" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{prog.progress.current} / {prog.progress.needed} XP</span>
            <span className="text-muted-foreground">{prog.progress.percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
