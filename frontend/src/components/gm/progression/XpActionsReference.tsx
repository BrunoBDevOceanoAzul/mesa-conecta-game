import { Zap } from "lucide-react";
import { useXpConfig } from "@/hooks/use-xp-config";

export function XpActionsReference() {
  const { actions } = useXpConfig();

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-secondary" /> Ações que dão XP
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((a) => (
          <div key={a.type} className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{a.label}</p>
              {a.description && (
                <p className="text-[10px] text-muted-foreground truncate">{a.description}</p>
              )}
            </div>
            <span className="text-xs font-bold text-secondary shrink-0 ml-2">+{a.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
