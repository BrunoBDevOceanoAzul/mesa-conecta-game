import { motion } from "framer-motion";
import { Gamepad2, Crown, Store, Megaphone } from "lucide-react";

const profiles = [
  {
    icon: Gamepad2,
    title: "Jogador",
    subtitle: "Encontre sua mesa ideal",
    features: [
      "Matchmaking inteligente por estilo, sistema e cidade",
      "Reserva com 2 cliques",
      "Histórico e recomendações personalizadas",
      "Perfil de compatibilidade exclusivo",
    ],
    gradient: "from-primary to-primary/60",
  },
  {
    icon: Crown,
    title: "Mestre",
    subtitle: "Profissionalize suas sessões",
    features: [
      "Perfil profissional com portfólio",
      "CRM integrado com leads e tags",
      "Calculadora de preço por sessão",
      "Analytics de impressões, cliques e reservas",
    ],
    gradient: "from-secondary to-secondary/60",
  },
  {
    icon: Store,
    title: "Loja / Luderia",
    subtitle: "Organize e cresça",
    features: [
      "Agenda pública com reservas automáticas",
      "Gestão de mesas e capacidade",
      "Visibilidade no feed e busca",
      "Planos por volume com analytics",
    ],
    gradient: "from-accent to-accent/60",
  },
  {
    icon: Megaphone,
    title: "Marca",
    subtitle: "Alcance a comunidade certa",
    features: [
      "Posts patrocinados no feed",
      "Segmentação por perfil e interesse",
      "Dashboard de campanha com métricas",
      "CPC configurável e transparente",
    ],
    gradient: "from-primary via-secondary to-primary",
  },
];

export function ProfilesSection() {
  return (
    <section id="perfis" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold md:text-4xl">
            Um produto. <span className="gradient-text">Quatro poderes.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Cada perfil tem ferramentas sob medida. Nada genérico, nada sobrando.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              className="card-hover rounded-xl border border-border bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.gradient} text-primary-foreground`}>
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{p.subtitle}</p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
