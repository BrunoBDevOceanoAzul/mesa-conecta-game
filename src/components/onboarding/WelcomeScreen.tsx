import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(38 88% 55%), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 15 }}
          className="mx-auto mb-10 w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground leading-[1.15] tracking-tight"
        >
          Vamos personalizar
          <br />
          <span className="gradient-text">sua experiência</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-muted-foreground text-[15px] leading-relaxed max-w-sm mx-auto"
        >
          Em poucos passos, a Hivium entende seu estilo e organiza a experiência ideal para você.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-12"
        >
          <Button
            variant="gradient"
            size="lg"
            onClick={onStart}
            className="px-12 text-base h-13"
          >
            Começar
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-8 text-xs text-muted-foreground/40"
        >
          Leva cerca de 3 minutos · Você pode ajustar tudo depois
        </motion.p>
      </div>
    </motion.div>
  );
}
