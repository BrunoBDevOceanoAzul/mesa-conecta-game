import { motion } from "framer-motion";
import { UserPlus, Sliders, Search, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    desc: "Jogador, mestre, loja ou marca. 30 segundos.",
    detail: "Sem cartão",
    iconColor: "text-plum-500",
    iconBg: "bg-plum-50",
  },
  {
    icon: Sliders,
    title: "Calibre seu perfil",
    desc: "Gostos, sistemas, cidade e estilo. O algoritmo faz o resto.",
    detail: "600+ sistemas",
    iconColor: "text-coral-400",
    iconBg: "bg-coral-50",
  },
  {
    icon: Search,
    title: "Receba matches curados",
    desc: "Mesas ranqueadas por aderência. Score visível.",
    detail: "Matchmaking real",
    iconColor: "text-gold-500",
    iconBg: "bg-gold-50",
  },
  {
    icon: CalendarCheck,
    title: "Reserve e jogue",
    desc: "Vaga garantida em 2 cliques. CRM atualizado. Agenda sincronizada.",
    detail: "Fluxo integrado",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Como funciona</span>
          <h2 className="section-heading">
            Do cadastro à mesa.{" "}
            <span className="gradient-text">5 minutos.</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="rounded-2xl border border-border bg-card p-6 h-full transition-all duration-300 group-hover:border-plum-200 group-hover:shadow-md">
                <span className="text-5xl font-display font-bold text-plum-100 block mb-4 select-none leading-none">
                  0{i + 1}
                </span>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                <span className="inline-flex rounded-full bg-plum-50 px-3 py-1 text-[11px] text-plum-500 font-medium">
                  {s.detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
