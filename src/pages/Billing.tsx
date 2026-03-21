import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type SubscriptionStatus, type Plan } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Crown, Store, Sparkles, Calendar, ArrowRight,
  CheckCircle2, XCircle, AlertTriangle, Clock, Loader2,
  Zap, RefreshCw, ArrowUpRight, Receipt, Shield, TrendingUp,
  Gamepad2, ChevronRight, Lock, Star, CircleDot
} from "lucide-react";

/* ─── Status visual config ─── */
const statusConfig: Record<SubscriptionStatus, {
  label: string;
  color: string;
  dotColor: string;
  icon: React.ReactNode;
  message: string;
  cta: string;
}> = {
  active: {
    label: "Ativo",
    color: "bg-green-500/15 text-green-400 border-green-500/25",
    dotColor: "bg-green-400",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    message: "Seu plano está ativo. Recursos premium liberados para sua conta.",
    cta: "",
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    dotColor: "bg-yellow-400",
    icon: <Clock className="h-3.5 w-3.5" />,
    message: "Seu pagamento está sendo processado. Aguarde a confirmação.",
    cta: "",
  },
  trial: {
    label: "Período de Teste",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    dotColor: "bg-blue-400",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    message: "Você está no período de teste. Aproveite os recursos premium!",
    cta: "",
  },
  past_due: {
    label: "Inadimplente",
    color: "bg-red-500/15 text-red-400 border-red-500/25",
    dotColor: "bg-red-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    message: "Não conseguimos confirmar sua cobrança. Atualize seu pagamento para manter seus recursos ativos.",
    cta: "Atualizar pagamento",
  },
  canceled: {
    label: "Cancelamento agendado",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    dotColor: "bg-orange-400",
    icon: <XCircle className="h-3.5 w-3.5" />,
    message: "Seu plano seguirá ativo até o fim do período atual. Depois disso, os recursos premium serão desativados.",
    cta: "Reativar plano",
  },
  expired: {
    label: "Expirado",
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
    icon: <XCircle className="h-3.5 w-3.5" />,
    message: "Seu plano não está mais ativo. Reative para voltar a usar todos os recursos premium.",
    cta: "Reativar agora",
  },
  inactive: {
    label: "Inativo",
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
    icon: <Lock className="h-3.5 w-3.5" />,
    message: "Sua assinatura está inativa. Escolha um plano para liberar recursos premium.",
    cta: "Ver planos",
  },
  none: {
    label: "Sem plano",
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
    icon: <CreditCard className="h-3.5 w-3.5" />,
    message: "Você ainda não possui um plano ativo. Desbloqueie mais capacidade, organização e alcance.",
    cta: "Escolher plano",
  },
};

type BillingTab = "overview" | "plans" | "history";

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const sub = useSubscription();
  const [tab, setTab] = useState<BillingTab>("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-refresh after Stripe checkout redirect
  useEffect(() => {
    const checkoutResult = searchParams.get("checkout");
    if (checkoutResult === "success" || checkoutResult === "credits_success") {
      toast({
        title: checkoutResult === "credits_success" ? "Créditos adquiridos! 🎉" : "Assinatura confirmada! 🎉",
        description: "Seu pagamento foi processado. Os dados serão atualizados em instantes.",
      });
      // Remove query params and refresh subscription data
      setSearchParams({}, { replace: true });
      // Poll for webhook sync (may take a few seconds)
      const intervals = [2000, 5000, 10000];
      intervals.forEach((delay) => setTimeout(() => sub.refresh(), delay));
    } else if (checkoutResult === "cancel") {
      toast({ title: "Checkout cancelado", description: "Nenhuma cobrança foi realizada." });
      setSearchParams({}, { replace: true });
    }
  }, []);

  const displayName = user?.user_metadata?.name || "Usuário";
  const cfg = statusConfig[sub.status];
  const roleIcon = sub.userRole === "store" ? <Store className="h-4 w-4" /> : sub.userRole === "gm" ? <Crown className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />;

  const navItems = [
    { label: "Início", path: sub.userRole === "store" ? "/dashboard/loja" : sub.userRole === "gm" ? "/dashboard/mestre" : "/dashboard/jogador", icon: roleIcon },
    { label: "Assinatura", path: "/billing", icon: <CreditCard className="h-4 w-4" /> },
    { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const rolePlans = sub.allPlans.filter((p) => p.role === sub.userRole);

  async function handleSubscribe(plan: Plan) {
    setActionLoading(true);
    const ok = await sub.subscribe(plan.code);
    setActionLoading(false);
    if (ok) toast({ title: "Assinatura criada! 🎉", description: `Seu plano ${plan.name} foi ativado.` });
    else toast({ title: "Erro ao criar assinatura", description: "Tente novamente em instantes.", variant: "destructive" });
  }

  async function handleCancel() {
    setActionLoading(true);
    const ok = await sub.cancelSubscription();
    setActionLoading(false);
    if (ok) toast({ title: "Cancelamento solicitado", description: "Seu plano permanecerá ativo até o fim do período." });
    else toast({ title: "Cancelamento ainda não disponível", description: "Entre em contato com o suporte.", variant: "destructive" });
  }

  async function handleReactivate() {
    setActionLoading(true);
    const ok = await sub.reactivateSubscription();
    setActionLoading(false);
    if (ok) toast({ title: "Plano reativado!" });
    else toast({ title: "Reativação ainda não disponível", description: "Entre em contato com o suporte.", variant: "destructive" });
  }

  async function handleChangePlan(plan: Plan) {
    setActionLoading(true);
    const ok = await sub.changePlan(plan.code);
    setActionLoading(false);
    if (ok) toast({ title: "Plano alterado!", description: `Agora você está no ${plan.name}.` });
    else toast({ title: "Erro ao alterar plano", variant: "destructive" });
  }

  async function handleManageSubscription() {
    // Internal management — just switch to plans tab
    setTab("plans");
  }

  if (sub.loading) {
    return (
      <DashboardLayout role={(sub.userRole || "player") as any} navItems={navItems} userName={displayName}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Carregando assinatura…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: BillingTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Meu Plano", icon: <Shield className="h-4 w-4" /> },
    { key: "plans", label: "Planos", icon: <Sparkles className="h-4 w-4" /> },
    { key: "history", label: "Pagamentos", icon: <Receipt className="h-4 w-4" /> },
  ];

  const periodEndFormatted = sub.subscription?.current_period_end
    ? new Date(sub.subscription.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <DashboardLayout role={(sub.userRole || "player") as any} navItems={navItems} userName={displayName}>
      <div className="space-y-8 max-w-4xl">

        {/* ─── Header ─── */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            Assinatura & Faturamento
          </h1>
          <p className="text-sm text-muted-foreground mt-2 ml-[52px]">Gerencie seu plano, recursos e pagamentos.</p>
        </div>

        {/* ─── Tabs ─── */}
        <div className="dash-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key ? "dash-tab-active" : "dash-tab-inactive"}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            TAB: OVERVIEW
            ═══════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">

            {/* Hero status card */}
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              {/* Decorative gradient glow */}
              {sub.isActive && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/8 via-secondary/5 to-transparent pointer-events-none" />
              )}

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div className="space-y-3 flex-1">
                    {/* Status badge */}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`${cfg.color} gap-1.5 px-3 py-1`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor} animate-pulse`} />
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Plan name */}
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                        {sub.plan?.name || "Nenhum plano ativo"}
                      </h2>
                      {sub.plan && (
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-xl font-display font-bold text-secondary">
                            R${(sub.plan.price_monthly / 100).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {cfg.message}
                    </p>
                  </div>

                  {/* Renewal info */}
                  {sub.isActive && periodEndFormatted && (
                    <div className="sm:text-right shrink-0 rounded-xl border border-border bg-muted/30 p-4 sm:min-w-[180px]">
                      <div className="flex items-center gap-2 sm:justify-end mb-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {sub.subscription?.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}
                        </span>
                      </div>
                      <p className="text-sm font-display font-bold text-foreground">{periodEndFormatted}</p>
                      <div className="flex items-center gap-1.5 mt-2 sm:justify-end">
                        <div className="h-1 flex-1 sm:max-w-[100px] rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.max(5, 100 - (sub.daysRemaining / 30) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{sub.daysRemaining}d</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
                  {(sub.status === "none" || sub.status === "expired" || sub.status === "inactive") && (
                    <Button variant="gradient" size="default" className="gap-2" onClick={() => setTab("plans")}>
                      <Sparkles className="h-4 w-4" /> Escolher plano
                    </Button>
                  )}

                  {sub.status === "canceled" && sub.isActive && (
                    <Button variant="default" size="default" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleReactivate} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Reativar plano
                    </Button>
                  )}

                  {sub.status === "active" && (
                    <>
                      <Button variant="outline" size="default" className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/10" onClick={handleManageSubscription} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                        Gerenciar assinatura
                      </Button>
                      <Button variant="outline" size="default" className="gap-2" onClick={() => setTab("plans")}>
                        <Sparkles className="h-4 w-4" /> Ver planos
                      </Button>
                    </>
                  )}

                  {sub.status === "past_due" && (
                    <Button variant="default" size="default" className="gap-2 bg-destructive hover:bg-destructive/90" onClick={handleManageSubscription} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Atualizar pagamento
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Features included */}
            {sub.plan && Object.keys(sub.featureFlags).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                    <Star className="h-4 w-4 text-secondary" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">Recursos incluídos no seu plano</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(sub.featureFlags).map(([key, value]) => {
                    if (value === false) return null;
                    return (
                      <div key={key} className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                        <span className="text-sm text-foreground">{featureFlagLabel(key, value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick link to payments */}
            <button
              onClick={() => setTab("history")}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-card/50 hover:bg-card p-4 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">Histórico de pagamentos</span>
                {sub.payments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{sub.payments.length}</Badge>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: PLANS
            ═══════════════════════════════════════════ */}
        {tab === "plans" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">
                Planos para {sub.userRole === "gm" ? "Mestres" : sub.userRole === "store" ? "Luderias" : "Jogadores"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para o seu perfil e desbloqueie recursos premium.</p>
            </div>

            {rolePlans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">Nenhum plano disponível para o seu perfil no momento.</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${rolePlans.length === 1 ? "max-w-md" : "sm:grid-cols-2"}`}>
                {rolePlans.map((p, idx) => {
                  const isCurrent = sub.plan?.code === p.code && sub.isActive;
                  const isUpgrade = sub.plan && p.price_monthly > sub.plan.price_monthly && sub.isActive;
                  const isHighlighted = idx === rolePlans.length - 1; // Last = premium tier

                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-2xl border overflow-hidden transition-all group ${
                        isCurrent
                          ? "border-primary/40 shadow-lg shadow-primary/10"
                          : isHighlighted
                          ? "border-secondary/30 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/10"
                          : "border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                      }`}
                    >
                      {/* Top accent bar */}
                      <div className={`h-1 w-full ${
                        isCurrent ? "bg-primary" : isHighlighted ? "bg-gradient-to-r from-secondary to-accent" : "bg-border"
                      }`} />

                      <div className="p-6 space-y-5">
                        {/* Header */}
                        <div>
                          {isCurrent && (
                            <Badge className="mb-2 bg-primary/15 text-primary border-primary/25 text-[10px]">
                              <CircleDot className="h-3 w-3 mr-1" /> Plano atual
                            </Badge>
                          )}
                          {isHighlighted && !isCurrent && (
                            <Badge className="mb-2 bg-secondary/15 text-secondary border-secondary/25 text-[10px]">
                              <Zap className="h-3 w-3 mr-1" /> Mais popular
                            </Badge>
                          )}
                          <h3 className="font-display font-bold text-xl text-foreground">{p.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed min-h-[2.5rem]">{p.description}</p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-3xl font-bold text-foreground">
                            R${(p.price_monthly / 100).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>

                        {/* Feature list */}
                        <ul className="space-y-2.5 pt-2 border-t border-border">
                          {Object.entries(p.feature_flags as Record<string, unknown>).map(([key, val]) => {
                            if (val === false) return null;
                            return (
                              <li key={key} className="flex items-start gap-2.5 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{featureFlagLabel(key, val)}</span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* CTA */}
                        <div className="pt-1">
                          {isCurrent ? (
                            <Button variant="outline" className="w-full border-primary/20 text-primary" disabled>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Plano atual
                            </Button>
                          ) : sub.isActive && sub.plan ? (
                            <Button
                              variant={isUpgrade ? "gradient" : "outline"}
                              className="w-full gap-2"
                              onClick={() => handleChangePlan(p)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isUpgrade ? <Zap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                              {isUpgrade ? "Fazer upgrade" : "Alterar para este plano"}
                            </Button>
                          ) : (
                            <Button
                              variant={isHighlighted ? "gradient" : "default"}
                              className="w-full gap-2"
                              onClick={() => handleSubscribe(p)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                              Assinar agora
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: PAYMENT HISTORY
            ═══════════════════════════════════════════ */}
        {tab === "history" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Histórico de pagamentos</h2>
              <p className="text-sm text-muted-foreground mt-1">Todos os pagamentos registrados na sua conta.</p>
            </div>

            {sub.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-base font-display font-semibold text-muted-foreground mb-1">Nenhum pagamento registrado</p>
                <p className="text-sm text-muted-foreground/70">Quando você assinar um plano, seus pagamentos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_100px_80px] gap-4 px-5 py-3 bg-muted/30 border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Descrição</span>
                  <span className="hidden sm:block">Data</span>
                  <span className="text-right">Valor</span>
                  <span className="text-center">Status</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border">
                  {sub.payments.map((p) => {
                    const statusStyle =
                      p.status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      p.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      p.status === "refunded" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-muted text-muted-foreground border-border";
                    const statusLabel =
                      p.status === "paid" ? "Pago" :
                      p.status === "failed" ? "Falhou" :
                      p.status === "refunded" ? "Reembolso" : "Pendente";
                    const statusIcon =
                      p.status === "paid" ? <CheckCircle2 className="h-3 w-3" /> :
                      p.status === "failed" ? <XCircle className="h-3 w-3" /> :
                      <Clock className="h-3 w-3" />;

                    return (
                      <div key={p.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.description || p.payment_type}</p>
                          <p className="text-[11px] text-muted-foreground sm:hidden mt-0.5">
                            {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className="hidden sm:block text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-sm font-display font-bold text-foreground text-right">
                          R${(p.amount / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <div className="flex justify-center">
                          <Badge variant="outline" className={`text-[10px] gap-1 ${statusStyle}`}>
                            {statusIcon} {statusLabel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── Feature flag label mapper ─── */
function featureFlagLabel(key: string, value: unknown): string {
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
    boost_access: "Ferramentas de destaque",
    priority_support: "Suporte prioritário",
    mesas_per_month: `Até ${value} mesas/mês`,
    store_profile: "Perfil da luderia",
    public_agenda: "Agenda pública",
    reservations: "Gestão de reservas",
    feed_highlight: "Feed destacado",
    dedicated_support: "Suporte dedicado",
  };
  return labels[key] || key.replace(/_/g, " ");
}
