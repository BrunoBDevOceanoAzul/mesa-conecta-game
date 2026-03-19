import { motion } from "framer-motion";
import { Target, Brain, BarChart3, Shield, Layers, Zap } from "lucide-react";

const differentials = [
  {
    icon: Brain,
    title: "Calibração inteligente",
    desc: "Leitura de perfil que alimenta matchmaking, CRM e recomendações curadas.",
    emphasis: "Cada resposta tem propósito.",
    iconColor: "text-plum-500",
    iconBg: "bg-plum-50",
  },
  {
    icon: Target,
    title: "Match com score real",
    desc: "Cruzamos cidade, formato, sistema e estilo. Resultado visível: 92%, 78%, 65%.",
    emphasis: "Não é sorte. É dado.",
    iconColor: "text-coral-400",
    iconBg: "bg-coral-50",
  },
  {
    icon: BarChart3,
    title: "CRM nativo para mestres",
    desc: "Leads, tags, histórico de reservas e analytics. Tudo integrado.",
    emphasis: "De hobby a operação.",
    iconColor: "text-gold-500",
    iconBg: "bg-gold-50",
  },
  {
    icon: Layers,
    title: "Agenda integrada",
    desc: "A luderia publica, o sistema preenche, o mestre recebe. Simples.",
    emphasis: "Organização gera receita.",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
  },
  {
    icon: Zap,
    title: "Destaque por créditos",
    desc: "CPC transparente. Destaque mesas e posts sem algoritmo obscuro.",
    emphasis: "Você controla o investimento.",
    iconColor: "text-coral-500",
    iconBg: "bg-coral-50",
  },
  {
    icon: Shield,
    title: "Ecossistema de confiança",
    desc: "Perfis verificados, calibração obrigatória, reviews pós-sessão.",
    emphasis: "Confiança é feature.",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
  },
];

export function DifferentialsSection() {
  return (
    <section className="py-28 md:py-36 border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-plum-100/30 blur-[250px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Diferenciais</span>
          <h2 className="section-heading">
            Outros listam mesas.{" "}
            <span className="gradient-text">A HIVIUM cria conexões.</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {differentials.map((d, i) => (
            <motion.div
              key={d.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-plum-200 hover:shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${d.iconBg}`}>
                <d.icon className={`h-5 w-5 ${d.iconColor}`} />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{d.desc}</p>
              <p className="text-xs font-medium text-plum-400 italic">{d.emphasis}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
