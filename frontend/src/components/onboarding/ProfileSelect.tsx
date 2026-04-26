import { motion } from "framer-motion";
import { roleInfo, type RoleKey } from "@/lib/onboarding-steps";
import { Dice5, BookOpen, Store, Megaphone, Swords, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Dice5, BookOpen, Store, Megaphone, Swords, Users,
};

interface ProfileSelectProps {
  onSelect: (role: RoleKey) => void;
}

interface ProfileOption {
  key: RoleKey;
  label: string;
  desc: string;
  icon: string;
  color: string;
  bg: string;
}

const options: ProfileOption[] = [
  {
    key: "jogador",
    label: "Jogador",
    desc: "Quero encontrar mesas, campanhas e grupos para jogar.",
    icon: "Dice5",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    key: "mestre",
    label: "Mestre",
    desc: "Quero criar mesas, conduzir sessões e encontrar jogadores.",
    icon: "BookOpen",
    color: "text-plum-500",
    bg: "bg-plum-50",
  },
  {
    key: "loja",
    label: "Loja / Luderia",
    desc: "Quero organizar eventos, agenda e comunidade na minha casa.",
    icon: "Store",
    color: "text-coral-400",
    bg: "bg-coral-50",
  },
];

export function ProfileSelect({ onSelect }: ProfileSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-plum-200/15 blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-coral-200/10 blur-[140px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="section-label">Perfil</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            Como você usa a HIVIUM?
          </h2>
          <p className="mt-2.5 text-[15px] text-muted-foreground leading-relaxed">
            Escolha o perfil que define sua experiência principal
          </p>
        </motion.div>

        <div className="grid gap-3">
          {options.map((opt, i) => {
            const Icon = iconMap[opt.icon] || Dice5;

            return (
              <motion.button
                key={opt.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => onSelect(opt.key)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5",
                  "text-left transition-all duration-300",
                  "hover:border-plum-200 hover:shadow-md",
                  "active:scale-[0.98]"
                )}
              >
                <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${opt.bg} ${opt.color} transition-all duration-300 group-hover:shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-[15px]">
                    {opt.label}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-plum-400" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
