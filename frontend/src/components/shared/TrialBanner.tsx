import { useTrialStatus } from "@/hooks/use-trial-status";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";

export function TrialBanner() {
  const { inTrial, daysRemaining, loading } = useTrialStatus();

  if (loading || !inTrial) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative rounded-xl border border-secondary/20 bg-secondary/5 p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <Zap className="h-4.5 w-4.5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              Acesso completo grátis por {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todas as funcionalidades estão liberadas durante o período de teste. Aproveite!
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
