import { Lock, Sparkles, ArrowRight, Gamepad2, Crown, Store, Zap, BarChart3, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePrivileges } from "@/hooks/use-privileges";
import type { FeatureKey } from "@/hooks/use-feature-access";

interface PaywallContext {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  benefits: string[];
  cta: string;
}

const paywallContexts: Record<string, PaywallContext> = {
  applications_per_month: {
    icon: <Gamepad2 className="h-7 w-7 text-teal-500" />,
    title: "Você chegou ao limite de candidaturas do plano gratuito",
    subtitle: "Desbloqueie mais candidaturas, prioridade em mesas e recomendações melhores.",
    benefits: [
      "Candidaturas ilimitadas por mês",
      "Prioridade em mesas populares",
      "Recomendações mais aderentes ao seu perfil",
      "Histórico completo de participações",
    ],
    cta: "Desbloquear mais candidaturas",
  },
  active_mesas: {
    icon: <Calendar className="h-7 w-7 text-plum-500" />,
    title: "Seu plano gratuito permite apenas 1 mesa ativa",
    subtitle: "Expanda sua atuação com mais mesas, gestão e recorrência.",
    benefits: [
      "Múltiplas mesas ativas ao mesmo tempo",
      "Gestão automatizada de jogadores",
      "Recorrência e agendamento avançado",
      "Mais visibilidade no ecossistema",
    ],
    cta: "Desbloquear mais mesas",
  },
  crm_access: {
    icon: <Users className="h-7 w-7 text-plum-500" />,
    title: "O CRM completo está disponível no plano premium",
    subtitle: "Organize jogadores, acompanhe leads e aumente sua recorrência.",
    benefits: [
      "Gestão profissional da sua comunidade",
      "Pipeline de leads e contatos",
      "Histórico de interações por jogador",
      "Automações de follow-up",
    ],
    cta: "Ativar CRM completo",
  },
  studio_access: {
    icon: <Zap className="h-7 w-7 text-primary" />,
    title: "O Estúdio IA é um recurso premium",
    subtitle: "Gere conteúdo, capas e textos com inteligência artificial integrada.",
    benefits: [
      "Geração de capas e materiais para mesas",
      "Assistente de texto para descrições e posts",
      "Conteúdo otimizado para engajamento",
      "Ferramentas exclusivas de criação",
    ],
    cta: "Ativar Estúdio IA",
  },
  analytics_access: {
    icon: <BarChart3 className="h-7 w-7 text-primary" />,
    title: "Analytics avançado faz parte do plano premium",
    subtitle: "Entenda seu desempenho, atribuição e oportunidades de crescimento.",
    benefits: [
      "Métricas de visibilidade e alcance",
      "Análise de conversão por mesa",
      "Atribuição de origem de jogadores",
      "Insights para otimizar operação",
    ],
    cta: "Ativar analytics",
  },
  cart_abandonment: {
    icon: <Crown className="h-7 w-7 text-secondary" />,
    title: "Recuperação de abandonos é um recurso premium",
    subtitle: "Veja quem iniciou reserva e não completou. Recupere receita perdida.",
    benefits: [
      "Painel de abandonos em tempo real",
      "Remarketing automático por WhatsApp/email",
      "Métricas de recuperação de receita",
      "Aumente conversão de reservas",
    ],
    cta: "Ativar recuperação",
  },
  boost_campaigns: {
    icon: <Sparkles className="h-7 w-7 text-secondary" />,
    title: "Campanhas de destaque fazem parte do plano premium",
    subtitle: "Aumente sua visibilidade e alcance mais jogadores com Boost.",
    benefits: [
      "Destaque nas listagens de mesas",
      "Mais impressões e cliques",
      "Segmentação por cidade e interesses",
      "Métricas de performance da campanha",
    ],
    cta: "Ativar Boost",
  },
  // Store-specific contexts
  store_tools: {
    icon: <Store className="h-7 w-7 text-coral-400" />,
    title: "Sua operação pode ir além com a gestão premium",
    subtitle: "Desbloqueie mais mesas, visibilidade e ferramentas para sua casa.",
    benefits: [
      "Agenda recorrente e gestão de slots",
      "Múltiplas mesas e eventos simultâneos",
      "Analytics de operação e ocupação",
      "Destaque e ativação na comunidade",
    ],
    cta: "Ativar operação completa",
  },
};

// Fallback for unknown features
const defaultContext: PaywallContext = {
  icon: <Lock className="h-7 w-7 text-primary" />,
  title: "Este recurso faz parte dos planos premium",
  subtitle: "Ative seu plano para desbloquear recursos de operação e crescimento.",
  benefits: [
    "Acesso completo às ferramentas",
    "Mais visibilidade e alcance",
    "Suporte prioritário",
  ],
  cta: "Ver planos disponíveis",
};

interface ContextualPaywallProps {
  /** Feature key — determines contextual copy */
  featureKey: string;
  /** Current usage count (optional, shown in subtitle) */
  usage?: number;
  /** Plan limit (optional, shown in subtitle) */
  limit?: number;
  /** If true, render children. If false, render the paywall. */
  allowed: boolean;
  /** Loading state */
  loading?: boolean;
  children: React.ReactNode;
}

export function ContextualPaywall({ featureKey, usage, limit, allowed, loading, children }: ContextualPaywallProps) {
  const navigate = useNavigate();
  const { isSuperUser } = usePrivileges();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-10 text-center animate-pulse">
        <div className="mx-auto h-10 w-10 rounded-xl bg-muted mb-3" />
        <div className="mx-auto h-4 w-40 rounded bg-muted mb-2" />
        <div className="mx-auto h-3 w-56 rounded bg-muted" />
      </div>
    );
  }

  if (allowed || isSuperUser) return <>{children}</>;

  const ctx = paywallContexts[featureKey] || defaultContext;

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* Blurred placeholder */}
      <div className="pointer-events-none select-none blur-[6px] opacity-20 p-6">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
        <div className="text-center max-w-sm px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mb-4">
            {ctx.icon}
          </div>
          <h3 className="text-base font-display font-bold text-foreground mb-1.5">
            {ctx.title}
          </h3>
          {usage !== undefined && limit !== undefined && limit > 0 && (
            <p className="text-xs text-muted-foreground/60 mb-2">
              {usage}/{limit} usado{usage !== 1 ? "s" : ""} neste período
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {ctx.subtitle}
          </p>
          <ul className="text-left text-sm text-muted-foreground space-y-1.5 mb-6 max-w-xs mx-auto">
            {ctx.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button variant="gradient" size="sm" className="gap-2" onClick={() => navigate("/billing")}>
            {ctx.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline contextual banner — lighter than full paywall.
 */
export function ContextualPaywallBanner({
  featureKey,
  usage,
  limit,
}: {
  featureKey: string;
  usage?: number;
  limit?: number;
}) {
  const navigate = useNavigate();
  const { isSuperUser } = usePrivileges();
  if (isSuperUser) return null;

  const ctx = paywallContexts[featureKey] || defaultContext;

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{ctx.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ctx.subtitle}</p>
          {usage !== undefined && limit !== undefined && limit > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (usage / limit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{usage}/{limit}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs h-7 px-3 mt-2"
            onClick={() => navigate("/billing")}
          >
            {ctx.cta} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
