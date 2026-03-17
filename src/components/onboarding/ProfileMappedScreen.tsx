import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
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
      {/* Ambient glow — celebratory */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.07 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 1.8, delay: 0.3 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(38 88% 55%), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Success icon with pulse */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 14 }}
          className="mx-auto mb-10 relative"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>
          {/* Subtle pulse ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.5, repeat: 2, repeatDelay: 0.5 }}
            className="absolute inset-0 rounded-3xl border-2 border-primary/30"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight"
        >
          Perfil mapeado
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-muted-foreground text-[15px] leading-relaxed max-w-sm mx-auto"
        >
          Agora a Hivium já pode recomendar mesas, conexões e oportunidades com muito mais aderência.
        </motion.p>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-8 p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.15em]">
              Resumo do perfil
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {summary}
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
                transition={{ delay: 0.9 + i * 0.05 }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold",
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
          className="mt-12"
        >
          <Button
            variant="gradient"
            size="lg"
            onClick={onContinue}
            className="px-10 text-base h-13 gap-2"
          >
            Entrar no dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
