import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  trial_days: number;
  is_founder_plan: boolean;
  founder_slots_total: number;
  founder_slots_used: number;
}

const featureFlagLabel = (key: string, value: unknown): string => {
  const labels: Record<string, string> = {
    reservation_limit: `Até ${value} reservas/mês`,
    matchmaking: "Matchmaking inteligente",
    history: "Histórico de mesas",
    profile_score: "Perfil de aderência",
    priority_booking: "Prioridade em mesas lotadas",
    exclusive_badge: "Insígnia exclusiva",
    early_access: "Acesso antecipado a eventos",
    professional_profile: "Perfil profissional",
    crm: "Mini CRM integrado",
    crm_advanced: "CRM avançado com tags",
    analytics_basic: "Analytics básico",
    analytics_full: "Analytics completo",
    max_active_mesas: value === -1 ? "Mesas ilimitadas" : `Até ${value} mesas ativas`,
    boost_access: "Ferramentas de crescimento",
    priority_support: "Suporte prioritário",
    mesas_per_month: `Até ${value} mesas/mês`,
    store_profile: "Perfil da luderia",
    public_agenda: "Agenda pública",
    reservations: "Gestão de reservas",
    feed_highlight: "Feed destacado",
    dedicated_support: "Suporte dedicado",
  };
  return labels[key] || key.replace(/_/g, " ");
};

// Determine highlight/badge based on sort_order (higher = premium)
const planMeta: Record<string, { highlight?: boolean; badge?: string; boostNote?: string }> = {
  player_free: {},
  player_adventurer: {},
  player_guild: { highlight: true, badge: "Popular" },
  gm_pro: { boostNote: "Take rate 5–10% por mesa" },
  gm_pro_plus: { highlight: true, badge: "Popular", boostNote: "Take rate 5–10% por mesa" },
  store_base: { boostNote: "Take rate ~5% por reserva" },
  store_growth: { highlight: true, badge: "Recomendado", boostNote: "Take rate ~3% por reserva" },
};

export function PricingSection() {
  const [activeRole, setActiveRole] = useState<RoleTab>("gm");
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("plans")
      .select("id, code, role, name, description, price_monthly, feature_flags, sort_order, trial_days, is_founder_plan, founder_slots_total, founder_slots_used")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setPlans((data as unknown as DBPlan[]) || []);
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
        <div className="flex justify-center gap-1 mb-14 bg-muted/30 rounded-xl p-1 max-w-xs mx-auto">
          {tabs.map((t) => (
            <button
              key={t.role}
              onClick={() => setActiveRole(t.role)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeRole === t.role
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
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
              .map(([k, v]) => featureFlagLabel(k, v));

            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl border p-8 transition-all ${
                  meta.highlight
                    ? "border-primary/30 bg-card shadow-xl shadow-primary/5"
                    : "border-border bg-card/50"
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

                {plan.trial_days > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {plan.trial_days} dias grátis para testar
                  </p>
                )}

                <ul className="mt-8 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {meta.boostNote && (
                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] text-primary/80">{meta.boostNote}</span>
                  </div>
                )}

                <Button
                  variant={meta.highlight ? "gradient" : "outline"}
                  className="mt-8 w-full"
                  size="lg"
                  onClick={() => navigate("/cadastro")}
                >
                  {plan.price_monthly === 0
                    ? "Criar conta grátis"
                    : plan.trial_days > 0
                      ? "Testar grátis"
                      : "Começar agora"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
