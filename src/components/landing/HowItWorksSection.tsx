import { motion } from "framer-motion";
import { UserPlus, Sliders, Search, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    desc: "Escolha seu perfil: jogador, mestre, loja ou marca. Leva 30 segundos.",
    detail: "Sem cartão de crédito",
  },
  {
    icon: Sliders,
    title: "Responda a anamnese",
    desc: "Conte seus gostos, sistemas, disponibilidade e estilo. O algoritmo faz o resto.",
    detail: "600+ sistemas reconhecidos",
  },
  {
    icon: Search,
    title: "Receba matches reais",
    desc: "Mesas, mestres e luderias ranqueados por compatibilidade. Score visível.",
    detail: "Matchmaking inteligente",
  },
  {
    icon: CalendarCheck,
    title: "Reserve e jogue",
    desc: "Garanta sua vaga em 2 cliques. O mestre recebe no CRM. A luderia atualiza a agenda.",
    detail: "Fluxo integrado",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-28 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Como funciona</p>
          <h2 className="text-3xl font-display font-bold md:text-5xl">
            Do cadastro à mesa<br className="hidden sm:block" /> <span className="gradient-text">em menos de 5 minutos</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="rounded-2xl border border-border bg-card p-6 h-full transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
                {/* Step number */}
                <div className="absolute -top-3 -left-1 font-display text-7xl font-bold text-muted/20 select-none">
                  {i + 1}
                </div>

                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                  <span className="inline-flex rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                    {s.detail}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
