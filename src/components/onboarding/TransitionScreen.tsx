import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface TransitionScreenProps {
  headline: string;
  subtext: string;
  onComplete: () => void;
  /** ms before auto-advancing */
  duration?: number;
}

export function TransitionScreen({ headline, subtext, onComplete, duration = 2200 }: TransitionScreenProps) {
  // Auto-advance after duration
  setTimeout(onComplete, duration);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
    >
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight leading-snug">
            {headline}
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-4 text-[15px] text-muted-foreground/70 leading-relaxed"
        >
          {subtext}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex justify-center"
        >
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </motion.div>
      </div>
    </motion.div>
  );
}
