import { motion } from "framer-motion";
import { pricingPlans } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/data/mock";

// No brand tab — brands don't have public pricing now
const tabs: { label: string; role: UserRole }[] = [
  { label: "Jogador", role: "player" },
  { label: "Mestre", role: "gm" },
  { label: "Luderia", role: "store" },
];

export function PricingSection() {
  const [activeRole, setActiveRole] = useState<UserRole>("gm");
  const filtered = pricingPlans.filter((p) => p.role === activeRole);

  return (
    <section id="planos" className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Planos</span>
          <h2 className="section-heading">
            Invista no que <span className="gradient-text">funciona</span>
          </h2>
          <p className="section-subheading mt-5">
            Comece grátis. Escale quando fizer sentido.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-14 bg-muted/30 rounded-xl p-1 max-w-xs mx-auto">
          {tabs.map((t) => (
            <button
              key={t.role}
              onClick={() => setActiveRole(t.role)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeRole === t.role
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className={`mx-auto grid gap-5 ${filtered.length === 1 ? "max-w-sm" : "max-w-3xl md:grid-cols-2"}`}>
          {filtered.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.highlight
                  ? "border-primary/30 bg-card shadow-xl shadow-primary/5"
                  : "border-border bg-card/50"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  R${plan.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Subtle boost mention for eligible plans */}
              {plan.boostNote && (
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[11px] text-primary/80">{plan.boostNote}</span>
                </div>
              )}

              <Button
                variant={plan.highlight ? "gradient" : "outline"}
                className="mt-8 w-full"
                size="lg"
              >
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
