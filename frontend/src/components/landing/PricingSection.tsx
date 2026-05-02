import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, CreditCard, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";

type RoleTab = "player" | "gm" | "store";

const tabs: { label: string; role: RoleTab }[] = [
  { label: "Jogador", role: "player" },
  { label: "Mestre", role: "gm" },
  { label: "Luderia", role: "store" },
];

interface DBPlan {
  id: string;
  code: string;
  role: string;
  name: string;
  description: string | null;
  price_monthly: number;
  feature_flags: Record<string, unknown>;
  sort_order: number;
  trial_days: number | null;
  is_founder_plan: boolean;
  founder_slots_total: number | null;
  founder_slots_used: number | null;
}

// Priority order for feature display (lower = shown first)
const featureOrder: Record<string, number> = {
  reservation_limit: 1,
  max_active_mesas: 1,
  mesas_per_month: 1,
  matchmaking: 2,
  professional_profile: 2,
  store_profile: 2,
  profile_score: 3,
  history: 4,
  crm: 5,
  crm_advanced: 5,
  reservations: 6,
  schedule_management: 7,
  public_agenda: 8,
  analytics_basic: 9,
  analytics_full: 9,
  ai_text_assist: 10,
  ai_cover_generation: 11,
  ai_seo_optimization: 12,
  ai_performance_insights: 13,
  boost_access: 14,
  feed_highlight: 15,
  priority_booking: 16,
  exclusive_badge: 17,
  early_access: 18,
  cashback: 19,
  priority_support: 20,
  dedicated_support: 20,
};

const featureFlagLabel = (key: string, value: unknown): string => {
  const labels: Record<string, string> = {
    reservation_limit: value === -1 ? "Reservas ilimitadas" : `Até ${value} reservas/mês`,
    matchmaking: "Matchmaking inteligente",
    history: "Histórico de mesas",
    profile_score: "Perfil de aderência",
    priority_booking: "Prioridade em mesas lotadas",
    exclusive_badge: "Insígnia exclusiva",
    early_access: "Acesso antecipado a eventos",
    cashback: "Cashback em reservas",
    professional_profile: "Perfil profissional",
    crm: "Mini CRM integrado",
    crm_advanced: "CRM avançado com tags",
    analytics_basic: "Analytics básico",
    analytics_full: "Analytics completo",
    max_active_mesas: value === -1 ? "Mesas ilimitadas" : `Até ${value} mesas ativas`,
    boost_access: "Ferramentas de destaque e crescimento",
    priority_support: "Suporte prioritário",
    mesas_per_month: `Até ${value} mesas/mês`,
    store_profile: "Perfil da luderia",
    public_agenda: "Agenda pública",
    reservations: "Gestão de reservas",
    feed_highlight: "Feed destacado",
    dedicated_support: "Suporte dedicado",
    schedule_management: "Agenda e gestão de horários",
    ai_text_assist: value === "full" ? "Assistente IA de texto completo" : "Assistente IA de texto",
    ai_cover_generation: value === -1 ? "Capas com IA ilimitadas" : `Até ${value} capas com IA/mês`,
    ai_seo_optimization: "Otimização SEO com IA",
    ai_performance_insights: "Insights de performance com IA",
  };
  return labels[key] || key.replace(/_/g, " ");
};

const planMeta: Record<string, { highlight?: boolean; badge?: string; boostNote?: string }> = {
  player_free: {},
  player_adventurer: {},
  player_guild: { highlight: true, badge: "Popular" },
  gm_pro: { boostNote: "Take rate 3–6% por mesa" },
  gm_pro_plus: { highlight: true, badge: "Popular", boostNote: "Take rate 3–6% por mesa" },
  store_base: { boostNote: "Take rate ~5% por reserva" },
  store_growth: { highlight: true, badge: "Recomendado", boostNote: "Take rate ~3% por reserva" },
};

export function PricingSection() {
  const [activeRole, setActiveRole] = useState<RoleTab>("gm");
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("billing_products")
      .select("id, code, name, description, price_cents, feature_flags, sort_order, target_role, stripe_price_id")
      .eq("is_active", true)
      .eq("is_public", true)
      .eq("product_type", "subscription")
      .order("sort_order")
      .then(({ data }) => {
        const mapped = (data || []).map((bp: any) => ({
          id: bp.id,
          code: bp.code,
          role: bp.target_role || "player",
          name: bp.name,
          description: bp.description,
          price_monthly: bp.price_cents,
          feature_flags: bp.feature_flags || {},
          sort_order: bp.sort_order ?? 99,
          trial_days: null,
          is_founder_plan: false,
          founder_slots_total: null,
          founder_slots_used: null,
        })) as DBPlan[];
        setPlans(mapped);
      });
  }, []);

  const filtered = plans.filter((p) => p.role === activeRole);

  return (
    <section id="planos" className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Planos</span>
          <h2 className="section-heading">
            Invista no que <span className="gradient-text">funciona</span>
          </h2>
          <p className="section-subheading mt-5">
            Comece grátis. Escale quando fizer sentido.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-14 bg-plum-50 rounded-xl p-1 max-w-xs mx-auto">
          {tabs.map((t) => (
            <button
              key={t.role}
              onClick={() => setActiveRole(t.role)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeRole === t.role
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className={`mx-auto grid gap-6 ${filtered.length <= 2 ? "max-w-2xl grid-cols-1 md:grid-cols-2" : "max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {filtered.map((plan, i) => {
            const meta = planMeta[plan.code] || {};
            const features = Object.entries(plan.feature_flags || {})
              .filter(([k, v]) => v !== false && k !== "founder_locked")
              .sort(([a], [b]) => (featureOrder[a] ?? 99) - (featureOrder[b] ?? 99))
              .map(([k, v]) => featureFlagLabel(k, v));

            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl border p-8 transition-all ${
                  meta.highlight
                    ? "border-plum-200 bg-card shadow-xl shadow-plum-200/20"
                    : "border-border bg-card"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {meta.badge && (
                  <span className="absolute -top-3 left-8 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    {meta.badge}
                  </span>
                )}
                <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
                {plan.description && (
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                )}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price_monthly === 0 ? "Grátis" : `R$${(plan.price_monthly / 100).toFixed(2).replace(".", ",")}`}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-sm text-muted-foreground">/mês</span>
                  )}
                </div>

                {plan.trial_days && plan.trial_days > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {plan.trial_days} dias grátis para testar
                  </p>
                )}

                <ul className="mt-8 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {meta.boostNote && (
                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-plum-100 bg-plum-50 px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-plum-400 shrink-0" />
                    <span className="text-[11px] text-plum-500">{meta.boostNote}</span>
                  </div>
                )}

                <Button
                  variant={meta.highlight ? "gradient" : "outline"}
                  className="mt-8 w-full"
                  size="lg"
                  onClick={() => {
                    if (plan.price_monthly === 0) {
                      router.push("/cadastro");
                    } else {
                      const baseCode = plan.code;
                      router.push(`/checkout?plan=${baseCode}&role=${plan.role}`);
                    }
                  }}
                >
                  {plan.price_monthly === 0
                    ? "Criar conta grátis"
                    : plan.trial_days && plan.trial_days > 0
                      ? "Testar grátis"
                      : "Começar agora"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Fee explanation for GM and Store */}
        {(activeRole === "gm" || activeRole === "store") && (
          <motion.div
            className="mt-10 max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
              <h3 className="text-base font-display font-semibold text-foreground">Como funcionam as taxas e o split</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              O pagamento é processado via plataforma com split automático. O valor da reserva é dividido instantaneamente entre as partes, sem repasses manuais. Cada participante tem sua própria carteira digital (wallet) no sistema.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              {/* Card */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Cartão de Crédito</span>
                </div>
                <p className="text-xs text-muted-foreground">Taxa de processamento: <span className="font-semibold text-foreground">2,99%</span></p>
              </div>
              {/* PIX */}
              <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium text-foreground">PIX</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Menor taxa</span>
                </div>
                <p className="text-xs text-muted-foreground">Taxa de processamento: <span className="font-semibold text-foreground">1,99%</span></p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Split automático da HIVIUM</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span>Plataforma HIVIUM: <span className="font-semibold text-foreground">5%</span> fixo sobre cada transação</span>
                </div>
                {activeRole === "gm" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-primary shrink-0" />
                      <span>Mesa online: Mestre recebe <span className="font-semibold text-foreground">95%</span> (- taxa de processamento)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-secondary shrink-0" />
                      <span>Mesa em luderia: Mestre e Loja dividem <span className="font-semibold text-foreground">50/50</span> dos 95%</span>
                    </div>
                  </>
                )}
                {activeRole === "store" && (
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-secondary shrink-0" />
                    <span>Luderia recebe <span className="font-semibold text-foreground">50% do valor</span> das mesas hospedadas (após split da plataforma)</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/70 mt-4 leading-relaxed">
              O repasse (split) é automático: cada wallet recebe sua parte imediatamente após a confirmação do pagamento. Sem burocracia, sem delays.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
