import { motion } from "framer-motion";
import { creditPackages } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Rocket, TrendingUp, Eye, MousePointerClick } from "lucide-react";

export function BoostSection() {
  return (
    <section id="impulsionamento" className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid gap-14 lg:grid-cols-2 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label">Impulsionamento</span>
            <h2 className="text-3xl font-display font-bold md:text-4xl leading-tight mb-5">
              Destaque sua mesa.{" "}
              <span className="gradient-text">Pague por clique.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Sem algoritmo obscuro. Compre créditos, impulsione no feed, pague por clique real. CPC configurável, transparência total.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Eye, label: "Impressões reais", desc: "Veja quem está vendo" },
                { icon: MousePointerClick, label: "CPC transparente", desc: "Pague por clique" },
                { icon: TrendingUp, label: "CTR e conversão", desc: "Meça o resultado" },
                { icon: Rocket, label: "Founders ganham grátis", desc: "20 primeiros mestres" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-card border border-border p-4">
                  <item.icon className="h-5 w-5 text-accent mb-2" />
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary/5 border border-secondary/15 p-4">
              <p className="text-sm text-secondary font-medium mb-1">🎁 Programa Founders</p>
              <p className="text-xs text-muted-foreground">Os 20 primeiros mestres ganham 3 impulsos grátis/mês por 6 meses.</p>
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              {creditPackages.map((pkg, i) => (
                <div
                  key={pkg.price}
                  className={`relative rounded-2xl border p-6 transition-all ${
                    i === 1
                      ? "border-accent/30 bg-card shadow-lg shadow-accent/5"
                      : "border-border bg-card/50"
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2.5 right-6 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-xl font-bold text-foreground">{pkg.credits} créditos</div>
                      <div className="text-sm text-muted-foreground">{pkg.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-foreground">R${pkg.price},00</div>
                      <div className="text-xs text-muted-foreground">R${(pkg.price / pkg.credits).toFixed(2).replace(".", ",")}/crédito</div>
                    </div>
                  </div>
                  <Button variant={i === 1 ? "accent" : "outline"} className="w-full mt-4">
                    Comprar créditos
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
