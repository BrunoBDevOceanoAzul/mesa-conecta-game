import { motion } from "framer-motion";
import { UserPlus, Sliders, Search, CalendarCheck } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Crie sua conta", desc: "Escolha seu perfil: jogador, mestre, loja ou marca." },
  { icon: Sliders, title: "Responda a anamnese", desc: "Conte seus gostos e o sistema encontra matches perfeitos." },
  { icon: Search, title: "Explore e descubra", desc: "Navegue mesas, mestres e luderias com score de compatibilidade." },
  { icon: CalendarCheck, title: "Reserve e jogue", desc: "Garanta sua vaga em 2 cliques. Simples assim." },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold md:text-4xl">
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Do cadastro à mesa em menos de 5 minutos.</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 font-display text-6xl font-bold text-muted/30">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
