import { motion } from "framer-motion";
import { pricingPlans, creditPackages } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/data/mock";

const tabs: { label: string; role: UserRole }[] = [
  { label: "Jogador", role: "player" },
  { label: "Mestre", role: "gm" },
  { label: "Loja", role: "store" },
  { label: "Marca", role: "brand" },
];

export function PricingSection() {
  const [activeRole, setActiveRole] = useState<UserRole>("player");
  const filtered = pricingPlans.filter((p) => p.role === activeRole);

  return (
    <section id="planos" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold md:text-4xl">
            Planos que <span className="gradient-text">cabem no seu jogo</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Escolha seu perfil e veja o plano ideal.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {tabs.map((t) => (
            <button
              key={t.role}
              onClick={() => setActiveRole(t.role)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeRole === t.role
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className={`mx-auto grid gap-6 ${filtered.length === 1 ? "max-w-sm" : "max-w-3xl md:grid-cols-2"}`}>
          {filtered.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-xl border p-6 ${
                plan.highlight
                  ? "border-primary/50 bg-card shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  R${plan.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "hero" : "outline"}
                className="mt-6 w-full"
              >
                Começar agora
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Credits */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="font-display font-semibold text-xl text-foreground mb-2">
            Créditos de Impulsionamento
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Destaque suas mesas e posts no feed. Compre créditos avulsos.
          </p>
          <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
            {creditPackages.map((pkg) => (
              <div key={pkg.price} className="relative rounded-xl border border-border bg-card p-5 text-center">
                {pkg.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">
                    {pkg.badge}
                  </span>
                )}
                <div className="font-display text-2xl font-bold text-foreground">{pkg.credits} créditos</div>
                <div className="mt-1 text-sm text-muted-foreground">{pkg.label}</div>
                <div className="mt-3 font-display text-lg font-semibold text-primary">
                  R${pkg.price},00
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Comprar
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
