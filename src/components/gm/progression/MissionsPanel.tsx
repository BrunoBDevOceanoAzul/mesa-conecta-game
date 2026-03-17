import { Target, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useXpConfig } from "@/hooks/use-xp-config";
import type { XpEvent } from "@/hooks/use-master-progression";

/** Maps action_type → a user-friendly mission description */
const MISSION_MAP: Record<string, { label: string; description: string }> = {
  onboarding_completed: { label: "Primeira Calibração", description: "Complete o processo de entrada na HIVIUM" },
  first_table_created: { label: "Mesa Inaugural", description: "Publique sua primeira mesa na plataforma" },
  third_table_created: { label: "Tríade Completa", description: "Publique 3 mesas ativas" },
  first_booking: { label: "Primeira Convocação", description: "Receba sua primeira reserva de jogador" },
  table_filled: { label: "Sessão Lotada", description: "Lote uma mesa inteira" },
  positive_review: { label: "Reconhecimento", description: "Receba uma avaliação positiva" },
  active_30_days: { label: "Operação Contínua", description: "30 dias ativos na plataforma" },
  active_90_days: { label: "Veterano", description: "90 dias de operação contínua" },
  post_published: { label: "Voz na Câmara", description: "Publique conteúdo no feed" },
  campaign_completed: { label: "Campanha Encerrada", description: "Complete uma campanha de destaque" },
};

interface Props {
  completedActions: Set<string>;
}

export function MissionsPanel({ completedActions }: Props) {
  const { actions } = useXpConfig();

  const missions = actions
    .filter((a) => MISSION_MAP[a.type])
    .map((a) => ({
      ...a,
      mission: MISSION_MAP[a.type],
      completed: completedActions.has(a.type),
    }));

  const pending = missions.filter((m) => !m.completed);
  const completed = missions.filter((m) => m.completed);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" /> Missões & Marcos
      </h3>

      {pending.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Próximas missões</p>
          {pending.slice(0, 5).map((m) => (
            <div key={m.type} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-muted/30 border border-border/50">
              <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{m.mission.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.mission.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-secondary">+{m.xp} XP</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Concluídas</p>
          {completed.map((m) => (
            <div key={m.type} className="flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-60">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground line-through">{m.mission.label}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">+{m.xp} XP</span>
            </div>
          ))}
        </div>
      )}

      {missions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma missão configurada.</p>
      )}
    </div>
  );
}
