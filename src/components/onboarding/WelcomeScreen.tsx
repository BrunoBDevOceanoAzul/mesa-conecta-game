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
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(270 55% 50%), transparent 70%)" }}
        />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.04 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(42 80% 52%), transparent 70%)" }}
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
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground leading-[1.15] tracking-tight"
        >
          Complete seu perfil e
          <br />
          <span className="gradient-text">melhore sua experiência</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-5 text-muted-foreground text-[15px] leading-relaxed max-w-sm mx-auto"
        >
          Adicione mais contexto para receber recomendações mais aderentes e desbloquear recursos personalizados.
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
            Começar
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 text-xs text-muted-foreground/35"
        >
          Leva cerca de 3 minutos · Você pode ajustar tudo depois
        </motion.p>
      </div>
    </motion.div>
  );
}
