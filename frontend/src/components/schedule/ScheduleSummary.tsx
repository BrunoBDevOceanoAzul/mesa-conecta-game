import { AvailabilityRule, AvailabilityException } from "@/hooks/use-availability";
import { Clock, CalendarOff, CalendarCheck, AlertTriangle } from "lucide-react";

const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatTime(t: string) {
  return t?.slice(0, 5) || "";
}

interface Props {
  rulesByDay: Record<number, AvailabilityRule[]>;
  futureExceptions: AvailabilityException[];
}

export function ScheduleSummary({ rulesByDay, futureExceptions }: Props) {
  const activeDays = Object.keys(rulesByDay).filter(
    (k) => rulesByDay[Number(k)]?.some((r) => r.is_active)
  );
  const totalBlocks = Object.values(rulesByDay).flat().filter((r) => r.is_active).length;
  const blockedDates = futureExceptions.filter((e) => e.exception_type === "blocked").length;

  // Compute total weekly hours
  const totalMinutes = Object.values(rulesByDay)
    .flat()
    .filter((r) => r.is_active)
    .reduce((sum, r) => {
      const [sh, sm] = r.start_time.split(":").map(Number);
      const [eh, em] = r.end_time.split(":").map(Number);
      return sum + (eh * 60 + em) - (sh * 60 + sm);
    }, 0);
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <CalendarCheck className="mx-auto h-5 w-5 text-primary mb-1.5" />
        <p className="text-xl font-display font-bold text-foreground">{activeDays.length}</p>
        <p className="text-[11px] text-muted-foreground">Dias ativos</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <Clock className="mx-auto h-5 w-5 text-primary mb-1.5" />
        <p className="text-xl font-display font-bold text-foreground">{totalBlocks}</p>
        <p className="text-[11px] text-muted-foreground">Blocos semanais</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <Clock className="mx-auto h-5 w-5 text-secondary mb-1.5" />
        <p className="text-xl font-display font-bold text-foreground">{totalHours}h</p>
        <p className="text-[11px] text-muted-foreground">Horas/semana</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        {blockedDates > 0 ? (
          <AlertTriangle className="mx-auto h-5 w-5 text-warning mb-1.5" />
        ) : (
          <CalendarOff className="mx-auto h-5 w-5 text-muted-foreground mb-1.5" />
        )}
        <p className="text-xl font-display font-bold text-foreground">{blockedDates}</p>
        <p className="text-[11px] text-muted-foreground">Bloqueios futuros</p>
      </div>
    </div>
  );
}
