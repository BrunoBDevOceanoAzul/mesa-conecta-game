import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep, RoleKey } from "@/lib/onboarding-steps";
import { stepsMap } from "@/lib/onboarding-steps";
import { generateBadges, type Badge } from "@/lib/badge-generator";

interface ReviewScreenProps {
  role: RoleKey;
  answers: Record<string, unknown>;
  onEdit: (stepIndex: number) => void;
  onConfirm: () => void;
  saving: boolean;
}

const badgeColors: Record<Badge["color"], string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function ReviewScreen({ role, answers, onEdit, onConfirm, saving }: ReviewScreenProps) {
  const steps = stepsMap[role];
  const badges = generateBadges(role, answers);

  const formatValue = (step: OnboardingStep): string => {
    const val = answers[step.field];
    if (!val) return "—";
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "—";
    if (typeof val === "number") return String(val);
    return val as string;
  };

  // Group availability display
  const availDays = answers.availability_days as string[] | undefined;
  const availTimes = answers.availability_times as string[] | undefined;
  const hasAvail = (availDays?.length || 0) > 0 || (availTimes?.length || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col items-center px-6 py-10 md:py-16"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="section-label">Revisão</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Tudo certo por aqui?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revise suas respostas antes de mapear seu perfil
          </p>
        </div>

        {/* Badges preview */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-5 rounded-2xl border border-border bg-card"
          >
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Suas badges
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-xs font-medium",
                    badgeColors[b.color]
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Answers */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            // Skip availability steps (show separately)
            if (step.type === "days-times") return null;
            const display = formatValue(step);
            if (display === "—" && !step.required) return null;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="group flex items-start justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{step.title}</p>
                  <p className="text-sm text-foreground font-medium truncate">{display}</p>
                </div>
                <button
                  onClick={() => onEdit(i)}
                  className="ml-3 shrink-0 p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}

          {/* Availability block */}
          {hasAvail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-start justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Disponibilidade</p>
                <p className="text-sm text-foreground font-medium">
                  {availDays?.join(", ") || "Flexível"} · {availTimes?.join(", ") || "—"}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={onConfirm}
            disabled={saving}
            className="px-10"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Mapeando...
              </span>
            ) : (
              "Mapear meu perfil"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
