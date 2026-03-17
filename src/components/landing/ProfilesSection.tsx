import { motion } from "framer-motion";
import { Gamepad2, Crown, Store, Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const profiles = [
  {
    id: "jogadores",
    icon: Gamepad2,
    title: "Para Jogadores",
    headline: "Sua próxima mesa já sabe combinar com você.",
    description: "Responda a anamnese. O Hivium entende seu estilo, seus sistemas favoritos, sua cidade e disponibilidade — e entrega matches com score de compatibilidade real.",
    features: [
      "Matchmaking inteligente por estilo, sistema e cidade",
      "Score de compatibilidade visível em cada mesa",
      "Reserva com 2 cliques — sem burocracia",
      "Histórico de sessões e recomendações que melhoram com o tempo",
    ],
    cta: "Encontrar mesas",
    ctaPath: "/buscar",
    gradient: "from-primary to-primary/50",
    accentColor: "text-primary",
    accentBg: "bg-primary/10",
  },
  {
    id: "mestres",
    icon: Crown,
    title: "Para Mestres",
    headline: "Menos tempo vendendo vaga. Mais tempo narrando.",
    description: "CRM nativo, calculadora de preço, analytics de campanha e impulsionamento por créditos. Tudo que um mestre profissional precisa para lotar mesas e fidelizar jogadores.",
    features: [
      "CRM integrado com leads, tags e histórico de reservas",
      "Calculadora de valor mínimo por sessão e por jogador",
      "Analytics: impressões, cliques, reservas e CTR",
      "Impulsionamento por créditos — destaque suas mesas no feed",
    ],
    cta: "Criar perfil de mestre",
    ctaPath: "/cadastro",
    gradient: "from-secondary to-secondary/50",
    accentColor: "text-secondary",
    accentBg: "bg-secondary/10",
    anchor: "mestres",
  },
  {
    id: "lojas",
    icon: Store,
    title: "Para Luderias",
    headline: "Organize mesas. Venda agenda. Meça resultado.",
    description: "Agenda pública, gestão de capacidade, visibilidade no feed e analytics de desempenho. Planos que crescem com o volume da casa.",
    features: [
      "Agenda pública com reservas automáticas",
      "Gestão de mesas simultâneas e capacidade",
      "Feed destacado para atrair jogadores da região",
      "Planos por volume com métricas de conversão",
    ],
    cta: "Cadastrar luderia",
    ctaPath: "/cadastro",
    gradient: "from-accent to-accent/50",
    accentColor: "text-accent",
    accentBg: "bg-accent/10",
    anchor: "lojas",
  },
  {
    id: "marcas",
    icon: Megaphone,
    title: "Para Marcas",
    headline: "Alcance quem compra jogos. Não quem só olha.",
    description: "Posts patrocinados nativos no feed, segmentação por perfil e interesse, dashboard de campanha com métricas reais. CPC transparente.",
    features: [
      "Posts patrocinados integrados ao feed (não banners)",
      "Segmentação por cidade, sistema, perfil e interesse",
      "Dashboard com impressões, cliques e CTR",
      "CPC configurável e créditos avulsos",
    ],
    cta: "Anunciar no Hivium",
    ctaPath: "/cadastro",
    gradient: "from-primary via-secondary to-primary",
    accentColor: "text-primary",
    accentBg: "bg-primary/10",
  },
];

export function ProfilesSection() {
  const navigate = useNavigate();

  return (
    <section id="perfis" className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Prova de valor</p>
          <h2 className="text-3xl font-display font-bold md:text-5xl leading-tight">
            Um produto. <span className="gradient-text">Quatro poderes.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
            Cada perfil tem ferramentas sob medida. Nada genérico, nada sobrando, nada faltando.
          </p>
        </motion.div>

        <div className="space-y-16">
          {profiles.map((p, i) => (
            <motion.div
              key={p.id}
              id={p.anchor}
              className={`grid gap-8 items-center lg:grid-cols-2 ${i % 2 !== 0 ? "lg:direction-rtl" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {/* Content */}
              <div className={i % 2 !== 0 ? "lg:order-2" : ""}>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${p.accentBg} ${p.accentColor} mb-4`}>
                  <p.icon className="h-4 w-4" />
                  {p.title}
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground md:text-3xl leading-tight mb-3">
                  {p.headline}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{p.description}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 bg-gradient-to-br ${p.gradient}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="hero-outline" onClick={() => navigate(p.ctaPath)}>
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Visual card */}
              <div className={i % 2 !== 0 ? "lg:order-1" : ""}>
                <div className="rounded-2xl border border-border bg-card/50 p-8 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${p.gradient} opacity-10 blur-3xl`} />
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-primary-foreground mb-6`}>
                    <p.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-3">
                    {p.features.slice(0, 3).map((f, fi) => (
                      <div key={fi} className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 border border-border/50">
                        <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${p.gradient}`} />
                        <span className="text-sm text-foreground/80">{f.split("—")[0].split("–")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
