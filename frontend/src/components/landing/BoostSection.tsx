import { motion } from "framer-motion";
import { creditPackages } from "@/data/constants";
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
            <span className="section-label">Destaque</span>
            <h2 className="text-3xl font-display font-bold md:text-4xl leading-tight mb-5">
              Destaque sua mesa.{" "}
              <span className="gradient-text">Pague por clique.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Sem algoritmo obscuro. Compre créditos, destaque no feed, pague por clique real. CPC configurável, transparência total.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Eye, label: "Impressões reais", desc: "Veja quem está vendo", color: "text-plum-500" },
                { icon: MousePointerClick, label: "CPC transparente", desc: "Pague por clique", color: "text-coral-400" },
                { icon: TrendingUp, label: "CTR e conversão", desc: "Meça o resultado", color: "text-teal-500" },
                { icon: Rocket, label: "Founders ganham grátis", desc: "20 primeiros mestres", color: "text-gold-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-card border border-border p-4 hover:shadow-sm transition-shadow">
                  <item.icon className={`h-5 w-5 ${item.color} mb-2`} />
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-gold-50 border border-gold-200/50 p-4">
              <p className="text-sm text-gold-600 font-medium mb-1">🎁 Programa Founders</p>
              <p className="text-xs text-muted-foreground">Os 20 primeiros mestres ganham 3 destaques grátis/mês por 6 meses.</p>
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
                      ? "border-gold-300/40 bg-card shadow-lg shadow-gold-300/10"
                      : "border-border bg-card"
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2.5 right-6 rounded-full bg-gold-500 px-3 py-0.5 text-xs font-bold text-white">
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
                  <Button variant={i === 1 ? "gradient" : "outline"} className="w-full mt-4">
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
