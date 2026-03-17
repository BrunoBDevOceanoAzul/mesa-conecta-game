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
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <span className="section-label">Revisão</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            Tudo certo por aqui?
          </h2>
          <p className="mt-2.5 text-[15px] text-muted-foreground leading-relaxed">
            Revise suas respostas antes de mapear seu perfil
          </p>
        </div>

        {/* Badges preview */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-6 rounded-2xl border border-border/60 bg-card/50"
          >
            <p className="text-xs font-semibold text-muted-foreground/60 mb-3 uppercase tracking-[0.15em]">
              Suas badges
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold",
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
        <div className="space-y-2.5">
          {steps.map((step, i) => {
            if (step.type === "days-times") return null;
            const display = formatValue(step);
            if (display === "—" && !step.required) return null;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                className="group flex items-start justify-between rounded-2xl border border-border/60 bg-card/50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground/60 mb-1 font-medium">{step.title}</p>
                  <p className="text-sm text-foreground font-semibold truncate">{display}</p>
                </div>
                <button
                  onClick={() => onEdit(i)}
                  className="ml-3 shrink-0 p-2 rounded-xl text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
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
              className="flex items-start justify-between rounded-2xl border border-border/60 bg-card/50 p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground/60 mb-1 font-medium">Disponibilidade</p>
                <p className="text-sm text-foreground font-semibold">
                  {availDays?.join(", ") || "Flexível"} · {availTimes?.join(", ") || "—"}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={onConfirm}
            disabled={saving}
            className="px-10 h-13"
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
