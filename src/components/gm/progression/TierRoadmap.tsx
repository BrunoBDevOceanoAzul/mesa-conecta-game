import { Star, ChevronRight } from "lucide-react";
import type { XpTier } from "@/lib/xp-config";

interface Props {
  tiers: XpTier[];
  currentLevel: number;
}

export function TierRoadmap({ tiers, currentLevel }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-secondary" /> Hierarquia de Mestres
      </h3>
      <div className="space-y-2">
        {tiers.map((t) => {
          const isActive = t.level === currentLevel;
          const isCompleted = t.level < currentLevel;
          return (
            <div
              key={t.level}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : isCompleted
                    ? "opacity-60"
                    : "opacity-40"
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              }`}>
                {t.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {t.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {t.maxXp === Infinity ? `${t.minXp}+` : `${t.minXp}–${t.maxXp}`} XP
              </span>
              {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
