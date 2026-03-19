import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CouponInput } from "@/components/checkout/CouponInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, CreditCard, Crown, Gamepad2, Loader2,
  Lock, Shield, Sparkles, Store, Check, Zap, Calendar
} from "lucide-react";

/* ─── Types ─── */
interface DBPlan {
  id: string;
  code: string;
  role: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_amount: number | null;
  feature_flags: Record<string, unknown>;
  sort_order: number;
  trial_days: number | null;
  billing_interval: string | null;
  interval_count: number | null;
  stripe_price_id: string | null;
  is_founder_plan: boolean | null;
}

interface ValidatedCoupon {
  id: string;
  public_code: string;
  discount_type: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string;
  duration_type: string;
  duration_in_months: number | null;
  stripe_promotion_code_id: string | null;
}

type BillingInterval = "monthly" | "quarterly" | "semiannual" | "annual";

const intervalLabels: Record<BillingInterval, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

const intervalSavings: Record<BillingInterval, number> = {
  monthly: 0,
  quarterly: 10,
  semiannual: 15,
  annual: 20,
};

const intervalMonths: Record<BillingInterval, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  player: { label: "Jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  gm: { label: "Mestre", icon: <Crown className="h-4 w-4" /> },
  store: { label: "Luderia", icon: <Store className="h-4 w-4" /> },
};

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

function formatBRL(cents: number): string {
  return `R$${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFirstMesa, setIsFirstMesa] = useState(true);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { planId: urlPlanId } = useParams();

  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selection state — support both /checkout/:planId and /checkout?plan=code
  const planParam = searchParams.get("plan") || "";
  const roleParam = searchParams.get("role") || "";
  const [selectedBasePlan, setSelectedBasePlan] = useState<string>(planParam);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(
    (searchParams.get("interval") as BillingInterval) || "monthly"
  );
  const [coupon, setCoupon] = useState<ValidatedCoupon | null>(null);

  // Check if user has any bookings (first mesa = free)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("player_user_id", user.id)
      .then(({ count }) => {
        setIsFirstMesa((count ?? 0) === 0);
      });
  }, [user]);

  // Fetch plans
  useEffect(() => {
    supabase
      .from("plans")
      .select("id, code, role, name, description, price_monthly, price_amount, feature_flags, sort_order, trial_days, billing_interval, interval_count, stripe_price_id, is_founder_plan")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const fetched = (data as unknown as DBPlan[]) || [];
        setPlans(fetched);
        setLoading(false);

        // Auto-select from URL: /checkout/:planId (UUID) or ?plan=code
        if (urlPlanId) {
          const match = fetched.find((p) => p.id === urlPlanId || p.code === urlPlanId);
          if (match) {
            const baseSuffixes = ["_quarterly", "_semiannual", "_annual"];
            let baseCode = match.code;
            let interval: BillingInterval = "monthly";
            for (const suffix of baseSuffixes) {
              if (match.code.endsWith(suffix)) {
                baseCode = match.code.replace(suffix, "");
                interval = suffix.replace("_", "") as BillingInterval;
                break;
              }
            }
            setSelectedBasePlan(baseCode);
            setSelectedInterval(interval);
          }
        } else if (planParam) {
          setSelectedBasePlan(planParam);
        }
      });
  }, []);

  // Derive base plan codes — include free plans when it's first mesa
  const basePlans = useMemo(() => {
    return plans.filter(
      (p) => (p.billing_interval === "monthly" || !p.billing_interval) && (isFirstMesa || p.price_monthly > 0)
    );
  }, [plans, isFirstMesa]);

  // Filter by role if provided
  const filteredBasePlans = useMemo(() => {
    if (roleParam) return basePlans.filter((p) => p.role === roleParam);
    return basePlans;
  }, [basePlans, roleParam]);

  // Get the selected base plan object
  const selectedBase = basePlans.find((p) => p.code === selectedBasePlan);

  // Find the exact plan for the selected interval
  const resolvedPlan = useMemo(() => {
    if (!selectedBase) return null;
    if (selectedInterval === "monthly") return selectedBase;

    // Look for the interval variant: e.g. gm_pro_quarterly
    const intervalCode = `${selectedBase.code}_${selectedInterval}`;
    return plans.find((p) => p.code === intervalCode) || null;
  }, [selectedBase, selectedInterval, plans]);

  // Available intervals for the selected base plan
  const availableIntervals = useMemo((): BillingInterval[] => {
    if (!selectedBase) return ["monthly"];
    const intervals: BillingInterval[] = ["monthly"];
    const suffixes: BillingInterval[] = ["quarterly", "semiannual", "annual"];
    for (const s of suffixes) {
      if (plans.some((p) => p.code === `${selectedBase.code}_${s}` && p.stripe_price_id)) {
        intervals.push(s);
      }
    }
    return intervals;
  }, [selectedBase, plans]);

  // Price calculations
  const priceTotal = useMemo(() => {
    if (!resolvedPlan) return 0;
    if (selectedInterval === "monthly") return resolvedPlan.price_monthly;
    return resolvedPlan.price_amount || 0;
  }, [resolvedPlan, selectedInterval]);

  const pricePerMonth = useMemo(() => {
    if (!resolvedPlan || !selectedBase) return 0;
    if (selectedInterval === "monthly") return resolvedPlan.price_monthly;
    const months = intervalMonths[selectedInterval];
    return Math.round((resolvedPlan.price_amount || 0) / months);
  }, [resolvedPlan, selectedBase, selectedInterval]);

  const monthlyOriginal = selectedBase?.price_monthly || 0;

  const discountedTotal = useMemo(() => {
    if (!coupon || priceTotal === 0) return priceTotal;
    if (coupon.discount_type === "percent" && coupon.percent_off) {
      return Math.round(priceTotal * (1 - coupon.percent_off / 100));
    }
    if (coupon.discount_type === "amount" && coupon.amount_off) {
      return Math.max(0, priceTotal - coupon.amount_off);
    }
    return priceTotal;
  }, [priceTotal, coupon]);

  // Handle free plan activation
  async function handleFreePlan() {
    if (!resolvedPlan || !user) return;
    setSubmitting(true);
    try {
      // Create a subscription record directly for free plans
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan_id: resolvedPlan.id,
        plan_name: resolvedPlan.name,
        plan_role: resolvedPlan.role,
        status: "active",
        price_cents: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      }, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Plano ativado!", description: "Seu plano gratuito foi ativado com sucesso." });
      navigate("/billing?checkout=success");
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Erro ao ativar plano", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  // Handle checkout
  async function handleCheckout() {
    if (!resolvedPlan || !user) return;

    // Free plan — activate directly without Stripe
    if (resolvedPlan.price_monthly === 0) {
      return handleFreePlan();
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan_code: resolvedPlan.code,
          coupon_code: coupon?.public_code || undefined,
          success_url: `${window.location.origin}/billing?checkout=success`,
          cancel_url: `${window.location.origin}/checkout?plan=${selectedBasePlan}&interval=${selectedInterval}&canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      const msg = err?.message || "Erro ao iniciar checkout";
      toast({ title: "Erro no checkout", description: msg, variant: "destructive" });
      setSubmitting(false);
    }
  }

  // Canceled return
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Checkout cancelado", description: "Nenhuma cobrança foi realizada." });
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-display font-bold text-foreground">Faça login para assinar</h1>
          <p className="text-sm text-muted-foreground">Você precisa estar logado para contratar um plano.</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/login")}>Entrar</Button>
            <Button variant="ghost" onClick={() => navigate("/cadastro")}>Criar conta</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-foreground">Checkout</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Pagamento seguro via Stripe
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* ─── Left: Plan Selection ─── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Step 1: Choose plan */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                <h2 className="text-lg font-display font-semibold text-foreground">Escolha seu plano</h2>
              </div>

              {/* Role filter tabs if no role specified */}
              {!roleParam && (
                <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
                  {(["player", "gm", "store"] as const).map((r) => {
                    const rl = roleLabels[r];
                    const hasPlans = filteredBasePlans.some((p) => p.role === r) || basePlans.some((p) => p.role === r);
                    if (!hasPlans) return null;
                    const isActive = selectedBase?.role === r || (!selectedBase && basePlans.filter((p) => p.role === r).length > 0);
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          const firstPlan = basePlans.find((p) => p.role === r);
                          if (firstPlan) setSelectedBasePlan(firstPlan.code);
                        }}
                        className={`flex items-center gap-2 flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                          selectedBase?.role === r
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {rl.icon}
                        {rl.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Plan cards */}
              <div className="grid sm:grid-cols-2 gap-3">
                {(roleParam ? filteredBasePlans : basePlans.filter((p) => p.role === (selectedBase?.role || "gm"))).map((plan) => {
                  const isSelected = selectedBasePlan === plan.code;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedBasePlan(plan.code);
                        setCoupon(null);
                      }}
                      className={`relative text-left rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/30 hover:bg-card"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {roleLabels[plan.role]?.icon}
                        <h3 className="font-display font-semibold text-foreground">{plan.name}</h3>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="flex items-baseline gap-1">
                        {plan.price_monthly === 0 ? (
                          <>
                            <span className="text-2xl font-display font-bold text-secondary">Grátis</span>
                            {isFirstMesa && (
                              <Badge className="ml-2 bg-secondary/10 text-secondary border-secondary/20 text-[10px]">
                                1ª mesa
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-display font-bold text-foreground">
                              {formatBRL(plan.price_monthly)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                          </>
                        )}
                      </div>
                      {plan.trial_days && plan.trial_days > 0 && plan.price_monthly > 0 && (
                        <p className="text-xs text-primary font-medium mt-1">{plan.trial_days} dias grátis</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Billing interval */}
            {selectedBase && availableIntervals.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Ciclo de cobrança</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableIntervals.map((interval) => {
                    const isSelected = selectedInterval === interval;
                    const savings = intervalSavings[interval];
                    return (
                      <button
                        key={interval}
                        onClick={() => setSelectedInterval(interval)}
                        className={`relative rounded-xl border p-4 text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        {savings > 0 && (
                          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[10px] px-2">
                            -{savings}%
                          </Badge>
                        )}
                        <p className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {intervalLabels[interval]}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {intervalMonths[interval] === 1 ? "Cobrado todo mês" : `A cada ${intervalMonths[interval]} meses`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Coupon */}
            {selectedBase && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {availableIntervals.length > 1 ? "3" : "2"}
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Cupom de desconto</h2>
                  <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                </div>
                <CouponInput planId={resolvedPlan?.id} onCouponApplied={setCoupon} />
              </div>
            )}
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-6">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Resumo do pedido
              </h3>

              {!selectedBase ? (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Selecione um plano para continuar</p>
                </div>
              ) : (
                <>
                  {/* Plan info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedBase.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {roleLabels[selectedBase.role]?.label} • {intervalLabels[selectedInterval]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatBRL(priceTotal)}</p>
                        {selectedInterval !== "monthly" && (
                          <p className="text-[11px] text-muted-foreground">
                            {formatBRL(pricePerMonth)}/mês
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Savings badge */}
                    {selectedInterval !== "monthly" && monthlyOriginal > 0 && (
                      <div className="rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-secondary" />
                        <span className="text-xs text-secondary font-medium">
                          Você economiza {formatBRL(monthlyOriginal * intervalMonths[selectedInterval] - priceTotal)} ({intervalSavings[selectedInterval]}% off)
                        </span>
                      </div>
                    )}

                    {/* Coupon discount */}
                    {coupon && priceTotal !== discountedTotal && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary">
                          Cupom {coupon.public_code}
                        </span>
                        <span className="text-secondary font-medium">
                          -{formatBRL(priceTotal - discountedTotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total</span>
                    <div className="text-right">
                      {coupon && priceTotal !== discountedTotal && (
                        <p className="text-xs text-muted-foreground line-through">{formatBRL(priceTotal)}</p>
                      )}
                      <p className="text-xl font-display font-bold text-foreground">
                        {discountedTotal === 0 ? "Grátis" : formatBRL(discountedTotal)}
                      </p>
                    </div>
                  </div>

                  {/* First mesa free notice */}
                  {resolvedPlan && resolvedPlan.price_monthly === 0 && isFirstMesa && (
                    <div className="rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-secondary" />
                      <span className="text-xs text-secondary font-medium">
                        Sua primeira mesa é por nossa conta! Jogue grátis e conheça a plataforma.
                      </span>
                    </div>
                  )}

                  {/* Trial notice */}
                  {resolvedPlan && resolvedPlan.trial_days && resolvedPlan.trial_days > 0 && resolvedPlan.price_monthly > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {resolvedPlan.trial_days} dias grátis — cobrança só após o período de teste
                      </span>
                    </div>
                  )}

                  {/* Features */}
                  {resolvedPlan && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Incluso</p>
                      <ul className="space-y-1.5">
                        {Object.entries(resolvedPlan.feature_flags || {})
                          .filter(([, v]) => v !== false)
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <li key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-primary shrink-0" />
                              {featureFlagLabel(k, v)}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full gap-2"
                    disabled={submitting || (resolvedPlan?.price_monthly !== 0 && !resolvedPlan?.stripe_price_id)}
                    onClick={handleCheckout}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {submitting
                      ? "Redirecionando…"
                      : resolvedPlan?.price_monthly === 0
                        ? "Ativar plano gratuito"
                        : "Finalizar assinatura"
                    }
                  </Button>

                  {!resolvedPlan?.stripe_price_id && resolvedPlan && resolvedPlan.price_monthly > 0 && (
                    <p className="text-xs text-destructive text-center">
                      Plano indisponível para este ciclo. Escolha outro.
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Ao confirmar, você será redirecionado para o checkout seguro do Stripe. Cancele quando quiser.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
