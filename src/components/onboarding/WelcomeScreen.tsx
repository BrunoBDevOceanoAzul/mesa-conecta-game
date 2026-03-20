import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Dice5, BookOpen, Store, Megaphone } from "lucide-react";
import type { RoleKey } from "@/lib/onboarding-steps";
import { roleThemes } from "@/lib/role-themes";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Dice5, BookOpen, Store, Megaphone, Sparkles,
};

interface WelcomeScreenProps {
  onStart: () => void;
  role?: RoleKey | null;
}

export function WelcomeScreen({ onStart, role }: WelcomeScreenProps) {
  const theme = role ? roleThemes[role] : null;
  const Icon = theme ? (iconMap[theme.iconName] || Sparkles) : Sparkles;

  const title1 = theme?.welcomeTitle[0] || "Complete seu perfil e";
  const title2 = theme?.welcomeTitle[1] || "melhore sua experiência";
  const subtitle = theme?.welcomeSubtitle || "Adicione mais contexto para receber recomendações mais aderentes e desbloquear recursos personalizados.";
  const footer = theme?.welcomeFooter || "Leva cerca de 3 minutos · Seu perfil fica mais inteligente com mais informações";
  const cta = theme?.welcomeCta || "Completar perfil";
  const glowColor = theme?.glowHsl || "hsl(270 55% 50%)";
  const secondaryGlow = theme?.secondaryGlowHsl || "hsl(42 80% 52%)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Ambient glow — role-themed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
        />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.04 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full"
          style={{ background: `radial-gradient(circle, ${secondaryGlow}, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 14 }}
          className="mx-auto mb-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Icon className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground leading-[1.15] tracking-tight"
          style={{ lineHeight: "1.15" }}
        >
          {title1}
          <br />
          <span className="gradient-text">{title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-5 text-muted-foreground text-[15px] leading-relaxed max-w-sm mx-auto"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12"
        >
          <Button
            variant="gradient"
            size="lg"
            onClick={onStart}
            className="px-12 text-base h-13"
          >
            {cta}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 text-xs text-muted-foreground/35"
        >
          {footer}
        </motion.p>
      </div>
    </motion.div>
  );
}
