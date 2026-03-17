import { motion } from "framer-motion";
import { roleInfo, type RoleKey } from "@/lib/onboarding-steps";
import { Dice5, BookOpen, Store, Megaphone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Dice5, BookOpen, Store, Megaphone,
};

interface ProfileSelectProps {
  onSelect: (role: RoleKey) => void;
}

const roles: RoleKey[] = ["jogador", "mestre", "loja", "marca"];

export function ProfileSelect({ onSelect }: ProfileSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="section-label">Perfil</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Como você usa a MesaNexo?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha o perfil que mais combina com você
          </p>
        </motion.div>

        <div className="grid gap-3">
          {roles.map((key, i) => {
            const info = roleInfo[key];
            const Icon = iconMap[info.icon] || Dice5;

            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => onSelect(key)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5",
                  "text-left transition-all duration-300",
                  "hover:border-primary/40 hover:shadow-[0_0_30px_hsl(272_60%_58%_/_0.08)]",
                  "active:scale-[0.98]"
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground text-base">
                    {info.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    {info.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
