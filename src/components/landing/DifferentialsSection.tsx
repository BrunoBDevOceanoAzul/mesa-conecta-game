import { motion } from "framer-motion";
import { Target, Brain, BarChart3, Shield, Layers, Zap } from "lucide-react";

const differentials = [
  {
    icon: Brain,
    title: "Anamnese inteligente",
    desc: "Não é formulário genérico. É uma leitura de perfil que alimenta matchmaking, CRM do mestre e recomendações da plataforma.",
    emphasis: "Cada resposta tem propósito.",
  },
  {
    icon: Target,
    title: "Matchmaking com score real",
    desc: "Cruzamos cidade, disponibilidade, ticket, formato, sistema e estilo de jogo. O resultado é um selo de compatibilidade visível: 92%, 78%, 65%.",
    emphasis: "Não é sorte. É dado.",
  },
  {
    icon: BarChart3,
    title: "CRM nativo para mestres",
    desc: "Mestres não são amadores com planilha. São profissionais que precisam de leads, tags, histórico de reservas e analytics num só lugar.",
    emphasis: "De hobby a negócio.",
  },
  {
    icon: Layers,
    title: "Agenda integrada para luderias",
    desc: "A luderia publica a agenda, o sistema preenche as vagas, o mestre recebe as reservas. Todo mundo ganha visibilidade.",
    emphasis: "Organização gera receita.",
  },
  {
    icon: Zap,
    title: "Impulsionamento por créditos",
    desc: "Micro-sistema de ads com CPC transparente. Mestres e lojas destacam mesas e posts sem depender de algoritmo obscuro.",
    emphasis: "Você controla o investimento.",
  },
  {
    icon: Shield,
    title: "Ecossistema fechado de confiança",
    desc: "Perfis verificados, anamnese obrigatória, reviews pós-sessão. Não é grupo de Facebook. É plataforma profissional.",
    emphasis: "Confiança é feature.",
  },
];

export function DifferentialsSection() {
  return (
    <section className="py-28 border-t border-border relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/3 blur-[200px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Por que somos diferentes</p>
          <h2 className="text-3xl font-display font-bold md:text-5xl leading-tight">
            Outras plataformas listam mesas.<br className="hidden sm:block" />
            <span className="gradient-text">Nós criamos conexões.</span>
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-lg">
            MesaQuest lista. Mestres da Lorota divulga. Hivium entende quem você é, o que você quer e faz o match acontecer.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {differentials.map((d, i) => (
            <motion.div
              key={d.title}
              className="group rounded-2xl border border-border bg-card/80 p-7 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                <d.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{d.desc}</p>
              <p className="text-xs font-medium text-primary/80 italic">{d.emphasis}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
