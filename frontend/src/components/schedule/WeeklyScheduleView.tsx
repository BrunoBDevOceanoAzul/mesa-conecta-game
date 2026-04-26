import { AvailabilityRule } from "@/hooks/use-availability";
import { Clock, Plus, Trash2, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: 0, label: "Dom", full: "Domingo" },
  { key: 1, label: "Seg", full: "Segunda" },
  { key: 2, label: "Ter", full: "Terça" },
  { key: 3, label: "Qua", full: "Quarta" },
  { key: 4, label: "Qui", full: "Quinta" },
  { key: 5, label: "Sex", full: "Sexta" },
  { key: 6, label: "Sáb", full: "Sábado" },
];

interface Props {
  rulesByDay: Record<number, AvailabilityRule[]>;
  onAddBlock: (day: number) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, isActive: boolean) => void;
  onCopyRule: (ruleId: string) => void;
  role: "gm" | "store";
}

function formatTime(t: string) {
  return t?.slice(0, 5) || "";
}

export function WeeklyScheduleView({ rulesByDay, onAddBlock, onDeleteRule, onToggleRule, onCopyRule, role }: Props) {
  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const blocks = rulesByDay[day.key] || [];
        const hasBlocks = blocks.length > 0;
        return (
          <div
            key={day.key}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              hasBlocks ? "border-primary/20 bg-card" : "border-border bg-card/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-display font-bold",
                  hasBlocks ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {day.label}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{day.full}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {hasBlocks ? `${blocks.length} bloco${blocks.length > 1 ? "s" : ""}` : "Sem horários"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary"
                onClick={() => onAddBlock(day.key)}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>

            {hasBlocks && (
              <div className="space-y-2 mt-3">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                      block.is_active
                        ? "border-primary/15 bg-primary/5"
                        : "border-border bg-muted/30 opacity-60"
                    )}
                  >
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatTime(block.start_time)} — {formatTime(block.end_time)}
                    </span>

                    {/* Format/modality tags */}
                    <div className="flex gap-1 flex-1 min-w-0 flex-wrap">
                      {(block.accepted_formats_json as string[] || []).map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                      {(block.accepted_modalities_json as string[] || []).map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copiar para outros dias"
                        onClick={() => onCopyRule(block.id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={block.is_active ? "Desativar" : "Ativar"}
                        onClick={() => onToggleRule(block.id, !block.is_active)}
                      >
                        {block.is_active ? (
                          <ToggleRight className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Remover"
                        onClick={() => onDeleteRule(block.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
