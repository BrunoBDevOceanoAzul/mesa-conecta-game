import { motion } from "framer-motion";
import { Gamepad2, Crown, Store, Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const profiles = [
  {
    id: "jogadores",
    icon: Gamepad2,
    title: "Jogadores",
    headline: "Sua próxima mesa já sabe combinar com você.",
    description: "Responda a anamnese. O sistema entende seu estilo, seus sistemas favoritos e entrega matches com score de compatibilidade real.",
    features: [
      "Matchmaking inteligente por estilo e cidade",
      "Score de compatibilidade visível em cada mesa",
      "Reserva com 2 cliques",
      "Recomendações que melhoram com o tempo",
    ],
    cta: "Encontrar mesas",
    ctaPath: "/buscar",
    accentColor: "text-primary",
    accentBg: "bg-primary/10",
    iconBg: "bg-primary/15",
  },
  {
    id: "mestres",
    icon: Crown,
    title: "Mestres",
    headline: "Menos tempo vendendo vaga. Mais tempo narrando.",
    description: "CRM nativo, calculadora de preço, analytics de campanha e impulsionamento. Tudo que um mestre profissional precisa.",
    features: [
      "CRM com leads, tags e histórico",
      "Calculadora de valor por sessão",
      "Analytics: impressões, cliques, CTR",
      "Impulsionamento por créditos no feed",
    ],
    cta: "Criar perfil de mestre",
    ctaPath: "/cadastro",
    accentColor: "text-secondary",
    accentBg: "bg-secondary/10",
    iconBg: "bg-secondary/15",
    anchor: "mestres",
  },
  {
    id: "lojas",
    icon: Store,
    title: "Luderias",
    headline: "Organize mesas. Venda agenda. Meça resultado.",
    description: "Agenda pública, gestão de capacidade e analytics. Planos que crescem com o volume da casa.",
    features: [
      "Agenda pública com reservas automáticas",
      "Gestão de mesas simultâneas",
      "Destaque no feed para a região",
      "Métricas de conversão e ocupação",
    ],
    cta: "Cadastrar luderia",
    ctaPath: "/cadastro",
    accentColor: "text-accent",
    accentBg: "bg-accent/10",
    iconBg: "bg-accent/15",
    anchor: "lojas",
  },
  {
    id: "marcas",
    icon: Megaphone,
    title: "Marcas",
    headline: "Alcance quem compra jogos. Não quem só olha.",
    description: "Posts patrocinados nativos, segmentação por perfil e dashboard de campanha com métricas reais.",
    features: [
      "Posts nativos no feed (não banners)",
      "Segmentação por cidade e interesse",
      "Dashboard com impressões e CTR",
      "CPC configurável e transparente",
    ],
    cta: "Anunciar",
    ctaPath: "/cadastro",
    accentColor: "text-primary",
    accentBg: "bg-primary/10",
    iconBg: "bg-primary/15",
  },
];

export function ProfilesSection() {
  const navigate = useNavigate();

  return (
    <section id="perfis" className="py-28 md:py-36">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Para quem é</span>
          <h2 className="section-heading">
            Um produto. <span className="gradient-text">Quatro poderes.</span>
          </h2>
          <p className="section-subheading mt-5">
            Cada perfil tem ferramentas sob medida. Nada genérico, nada sobrando.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((p, i) => (
            <motion.div
              key={p.id}
              id={p.anchor}
              className="group rounded-2xl border border-border bg-card/60 p-7 md:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${p.iconBg} mb-5`}>
                <p.icon className={`h-6 w-6 ${p.accentColor}`} />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 leading-tight">
                {p.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{p.description}</p>
              <ul className="space-y-2.5 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${p.accentBg.replace('/10', '')}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" onClick={() => navigate(p.ctaPath)} className={`${p.accentColor} hover:bg-transparent px-0`}>
                {p.cta} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
