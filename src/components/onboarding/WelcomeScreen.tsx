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
      {/* Glow backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(38 88% 55%), transparent 70%)" }} />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-8 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight"
        >
          Vamos personalizar
          <br />
          <span className="gradient-text">sua experiência</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4 text-muted-foreground text-base leading-relaxed max-w-sm mx-auto"
        >
          Em poucos passos, a MesaNexo entende seu estilo e organiza a experiência ideal para você.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <Button
            variant="gradient"
            size="lg"
            onClick={onStart}
            className="px-10 text-base"
          >
            Começar
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-xs text-muted-foreground/60"
        >
          Leva cerca de 3 minutos · Você pode ajustar tudo depois
        </motion.p>
      </div>
    </motion.div>
  );
}
