import { AvailabilityException } from "@/hooks/use-availability";
import { CalendarOff, CalendarClock, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  blocked: { label: "Bloqueado", icon: <CalendarOff className="h-3.5 w-3.5" />, className: "bg-destructive/10 text-destructive border-destructive/20" },
  custom_hours: { label: "Horário especial", icon: <CalendarClock className="h-3.5 w-3.5" />, className: "bg-info/10 text-info border-info/20" },
  special_event: { label: "Evento especial", icon: <Sparkles className="h-3.5 w-3.5" />, className: "bg-secondary/10 text-secondary border-secondary/20" },
  unavailable: { label: "Indisponível", icon: <CalendarOff className="h-3.5 w-3.5" />, className: "bg-muted text-muted-foreground border-border" },
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(t: string | null) {
  return t?.slice(0, 5) || "";
}

interface Props {
  exceptions: AvailabilityException[];
  onDelete: (id: string) => void;
}

export function ExceptionsList({ exceptions, onDelete }: Props) {
  if (exceptions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <CalendarOff className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">Nenhuma exceção configurada</p>
        <p className="text-xs text-muted-foreground mt-1">
          Bloqueie datas ou defina horários especiais quando necessário.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exceptions.map((exc) => {
        const config = TYPE_CONFIG[exc.exception_type] || TYPE_CONFIG.unavailable;
        return (
          <div key={exc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${config.className}`}>
              {config.icon}
              {config.label}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{formatDate(exc.exception_date)}</p>
              {exc.start_time && exc.end_time && (
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {formatTime(exc.start_time)} — {formatTime(exc.end_time)}
                </p>
              )}
              {exc.notes && <p className="text-[11px] text-muted-foreground truncate">{exc.notes}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
              onClick={() => onDelete(exc.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
