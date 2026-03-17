import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoleKey } from "@/lib/onboarding-steps";
import { generateBadges, generateProfileSummary, type Badge } from "@/lib/badge-generator";

interface ProfileMappedScreenProps {
  role: RoleKey;
  answers: Record<string, unknown>;
  onContinue: () => void;
}

const badgeColors: Record<Badge["color"], string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function ProfileMappedScreen({ role, answers, onContinue }: ProfileMappedScreenProps) {
  const badges = generateBadges(role, answers);
  const summary = generateProfileSummary(role, answers);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }} />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(38 88% 55%), transparent 70%)" }} />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground"
        >
          Perfil mapeado
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-muted-foreground text-base leading-relaxed"
        >
          A MesaNexo já pode mostrar experiências, mesas e oportunidades mais aderentes ao seu perfil.
        </motion.p>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-8 p-5 rounded-2xl border border-border bg-card text-left"
        >
          <p className="text-sm text-foreground/90 leading-relaxed italic">
            "{summary}"
          </p>
        </motion.div>

        {/* Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {badges.map((b, i) => (
              <motion.span
                key={b.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.06 }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  badgeColors[b.color]
                )}
              >
                {b.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-10"
        >
          <Button
            variant="gradient"
            size="lg"
            onClick={onContinue}
            className="px-10 text-base"
          >
            Entrar no dashboard <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
