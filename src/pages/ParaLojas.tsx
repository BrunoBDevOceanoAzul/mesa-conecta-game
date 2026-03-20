import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Store, Calendar, BarChart3, Users, Zap, Shield,
  MessageCircle, ArrowRight, CheckCircle2
} from "lucide-react";

const WHATSAPP_LINK = "https://wa.link/0h61ag";

const benefits = [
  {
    icon: Calendar,
    title: "Agenda pública automatizada",
    desc: "Seus horários visíveis para toda a comunidade. Reservas caem direto no painel sem precisar de WhatsApp.",
  },
  {
    icon: Users,
    title: "Gestão de mesas simultâneas",
    desc: "Controle capacidade, ocupação e fila de espera. Saiba exatamente quantas mesas estão rodando a cada noite.",
  },
  {
    icon: BarChart3,
    title: "Métricas de conversão",
    desc: "Veja impressões, cliques, reservas e taxa de ocupação. Dados reais para decisões reais.",
  },
  {
    icon: Zap,
    title: "Destaque regional no feed",
    desc: "Apareça primeiro para jogadores da sua cidade. Boost de visibilidade incluso nos planos pagos.",
  },
  {
    icon: Shield,
    title: "Pagamento seguro integrado",
    desc: "Stripe Connect configurado. O jogador paga online, você recebe direto na conta da loja.",
  },
  {
    icon: Store,
    title: "Perfil público da luderia",
    desc: "Página dedicada com fotos, jogos disponíveis, avaliações e link direto para reserva.",
  },
];

const steps = [
  { n: "01", title: "Crie sua conta grátis", desc: "Cadastro em 2 minutos. Sem cartão de crédito." },
  { n: "02", title: "Monte seu perfil", desc: "Adicione fotos, jogos, capacidade e horários de funcionamento." },
  { n: "03", title: "Publique sua agenda", desc: "Defina slots, preços e regras. Os jogadores encontram você." },
  { n: "04", title: "Receba reservas", desc: "Acompanhe tudo pelo painel. Métricas atualizadas em tempo real." },
];

const faqs = [
  { q: "Quanto custa para começar?", a: "Nada. O plano gratuito permite gerenciar até 2 mesas simultâneas. Planos pagos desbloqueiam analytics avançados, boost e volume ilimitado." },
  { q: "Preciso de conhecimento técnico?", a: "Não. A interface foi desenhada para lojistas. Se você usa WhatsApp, consegue usar a HIVIUM." },
  { q: "Como funciona o pagamento?", a: "Usamos Stripe Connect. O jogador paga online e o valor cai direto na conta da sua loja, descontada a taxa da plataforma." },
  { q: "Posso migrar minha agenda atual?", a: "Sim. Nossa equipe ajuda na migração. Fale conosco pelo WhatsApp." },
];

export default function ParaLojas() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              className="section-label"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Para Luderias & Game Stores
            </motion.span>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.08] tracking-tight text-foreground mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Transforme sua luderia em um{" "}
              <span className="gradient-text">hub de experiências.</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              Agenda automatizada, métricas de ocupação e visibilidade para jogadores da sua região.
              Menos planilha, mais mesas rodando.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                variant="gradient"
                size="xl"
                onClick={() => window.open(WHATSAPP_LINK, "_blank", "noopener,noreferrer")}
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Falar pelo WhatsApp
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                onClick={() => window.location.href = "/cadastro"}
              >
                Criar conta grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="section-label">Vantagens</span>
            <h2 className="section-heading mt-3">
              Tudo que sua luderia precisa.<br />
              <span className="gradient-text">Num só lugar.</span>
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-teal-200 hover:shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 mb-4">
                  <b.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="section-label">Como funciona</span>
            <h2 className="section-heading mt-3">
              Da criação à primeira reserva em <span className="gradient-text">minutos.</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                className="flex gap-5 items-start"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="font-display text-2xl font-bold text-teal-500 shrink-0 w-10">{s.n}</span>
                <div>
                  <h3 className="font-display font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="section-label">Dúvidas frequentes</span>
            <h2 className="section-heading mt-3">Perguntas de lojistas</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-border bg-card p-5"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.06 }}
              >
                <h3 className="font-display font-bold text-foreground text-sm">{f.q}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <h2 className="section-heading">
              Pronto para encher suas mesas?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              Fale com a gente pelo WhatsApp. Ajudamos na migração e tiramos todas as dúvidas.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="gradient"
                size="xl"
                onClick={() => window.open(WHATSAPP_LINK, "_blank", "noopener,noreferrer")}
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Falar pelo WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
