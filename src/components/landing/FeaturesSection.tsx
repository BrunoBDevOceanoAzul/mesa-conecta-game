import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Palette, CreditCard, Bell } from "lucide-react";

const features = [
  { icon: Zap, title: "Matchmaking Inteligente", desc: "Score de compatibilidade baseado em estilo, sistema, cidade e disponibilidade." },
  { icon: Shield, title: "CRM para Mestres", desc: "Gerencie seus jogadores com leads, tags e histórico de sessões." },
  { icon: BarChart3, title: "Analytics Completo", desc: "Impressões, cliques, reservas e CTR. Dados reais para decisões reais." },
  { icon: Palette, title: "Perfil Personalizado", desc: "Anamnese inteligente que monta seu perfil e encontra matches perfeitos." },
  { icon: CreditCard, title: "Reservas Simples", desc: "Reserve vagas em 2 cliques. Sem burocracia, sem atrito." },
  { icon: Bell, title: "Feed Segmentado", desc: "Conteúdo relevante de mestres, lojas e marcas na sua timeline." },
];

export function FeaturesSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold md:text-4xl">
            Tudo que o ecossistema <span className="gradient-text">precisa</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Ferramentas pensadas para quem joga, quem narra e quem organiza.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
