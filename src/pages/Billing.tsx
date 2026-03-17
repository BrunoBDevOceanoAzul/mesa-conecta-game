import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type SubscriptionStatus, type Plan } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Crown, Store, Sparkles, Calendar, ArrowRight,
  CheckCircle2, XCircle, AlertTriangle, Clock, Loader2,
  ChevronRight, Zap, RefreshCw, ArrowUpRight, Receipt,
  Shield, TrendingUp, Gamepad2
} from "lucide-react";

const statusConfig: Record<SubscriptionStatus, { label: string; color: string; icon: React.ReactNode; message: string }> = {
  active: { label: "Ativo", color: "bg-green-500/15 text-green-500 border-green-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" />, message: "Seu plano está ativo. Recursos premium liberados." },
  pending: { label: "Pendente", color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-3.5 w-3.5" />, message: "Seu pagamento está sendo processado." },
  trial: { label: "Teste", color: "bg-blue-500/15 text-blue-500 border-blue-500/20", icon: <Sparkles className="h-3.5 w-3.5" />, message: "Você está no período de teste." },
  past_due: { label: "Inadimplente", color: "bg-red-500/15 text-red-500 border-red-500/20", icon: <AlertTriangle className="h-3.5 w-3.5" />, message: "Não conseguimos confirmar sua cobrança. Atualize seu pagamento." },
  canceled: { label: "Cancelado", color: "bg-orange-500/15 text-orange-500 border-orange-500/20", icon: <XCircle className="h-3.5 w-3.5" />, message: "Seu plano segue ativo até o fim do período atual." },
  expired: { label: "Expirado", color: "bg-muted text-muted-foreground border-border", icon: <XCircle className="h-3.5 w-3.5" />, message: "Seu plano não está mais ativo. Reative para voltar a usar recursos premium." },
  inactive: { label: "Inativo", color: "bg-muted text-muted-foreground border-border", icon: <XCircle className="h-3.5 w-3.5" />, message: "Sua assinatura está inativa." },
  none: { label: "Sem plano", color: "bg-muted text-muted-foreground border-border", icon: <CreditCard className="h-3.5 w-3.5" />, message: "Você ainda não possui um plano ativo." },
};

type BillingTab = "overview" | "plans" | "history";

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const sub = useSubscription();
  const [tab, setTab] = useState<BillingTab>("overview");
  const [actionLoading, setActionLoading] = useState(false);

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
    if (ok) {
      toast({ title: "Plano ativado! 🎉", description: `${plan.name} está ativo na sua conta.` });
    } else {
      toast({ title: "Erro ao ativar plano", variant: "destructive" });
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    const ok = await sub.cancelSubscription(false);
    setActionLoading(false);
    if (ok) {
      toast({ title: "Cancelamento agendado", description: "Seu plano segue ativo até o fim do ciclo atual." });
    } else {
      toast({ title: "Erro ao cancelar", variant: "destructive" });
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    const ok = await sub.reactivateSubscription();
    setActionLoading(false);
    if (ok) {
      toast({ title: "Plano reativado! ✨", description: "Seus recursos premium foram restaurados." });
    } else {
      toast({ title: "Erro ao reativar", variant: "destructive" });
    }
  }

  async function handleChangePlan(plan: Plan) {
    setActionLoading(true);
    const ok = await sub.changePlan(plan.code);
    setActionLoading(false);
    if (ok) {
      toast({ title: "Plano alterado!", description: `Agora você está no ${plan.name}.` });
    } else {
      toast({ title: "Erro ao alterar plano", variant: "destructive" });
    }
  }

  if (sub.loading) {
    return (
      <DashboardLayout role={sub.userRole || "player"} navItems={navItems} userName={displayName}>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: BillingTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Meu Plano", icon: <Shield className="h-4 w-4" /> },
    { key: "plans", label: "Planos Disponíveis", icon: <Sparkles className="h-4 w-4" /> },
    { key: "history", label: "Pagamentos", icon: <Receipt className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role={sub.userRole || "player"} navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            Assinatura <CreditCard className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu plano, pagamentos e recursos.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-muted/40 p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Status card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`${cfg.color} gap-1`}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    {sub.plan?.name || "Sem plano ativo"}
                  </h2>
                  {sub.plan && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      R${(sub.plan.price_monthly / 100).toFixed(2).replace(".", ",")}/mês
                    </p>
                  )}
                </div>
                {sub.isActive && sub.plan && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próxima cobrança</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(sub.subscription!.current_period_end).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{sub.daysRemaining} dias restantes</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{cfg.message}</p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-5">
                {sub.status === "none" || sub.status === "expired" || sub.status === "inactive" ? (
                  <Button variant="gradient" size="sm" className="gap-2" onClick={() => setTab("plans")}>
                    <Sparkles className="h-4 w-4" /> Ver planos
                  </Button>
                ) : sub.status === "canceled" && sub.isActive ? (
                  <Button variant="default" size="sm" className="gap-2" onClick={handleReactivate} disabled={actionLoading}>
                    <RefreshCw className="h-4 w-4" /> Reativar plano
                  </Button>
                ) : sub.status === "active" ? (
                  <>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setTab("plans")}>
                      <ArrowUpRight className="h-4 w-4" /> Alterar plano
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive" onClick={handleCancel} disabled={actionLoading}>
                      <XCircle className="h-4 w-4" /> Cancelar ao fim do ciclo
                    </Button>
                  </>
                ) : sub.status === "past_due" ? (
                  <Button variant="default" size="sm" className="gap-2">
                    <CreditCard className="h-4 w-4" /> Atualizar pagamento
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Feature flags */}
            {sub.plan && Object.keys(sub.featureFlags).length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <h3 className="text-sm font-display font-semibold text-foreground mb-3">Recursos incluídos</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(sub.featureFlags).map(([key, value]) => {
                    if (value === false) return null;
                    const label = featureFlagLabel(key, value);
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── PLANS ─── */}
        {tab === "plans" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">Planos para {sub.userRole === "gm" ? "Mestres" : sub.userRole === "store" ? "Luderias" : "Jogadores"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Escolha o plano ideal para o seu perfil.</p>
            </div>

            {rolePlans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum plano disponível para o seu perfil.</p>
              </div>
            ) : (
              <div className={`grid gap-5 ${rolePlans.length === 1 ? "max-w-sm" : "sm:grid-cols-2"}`}>
                {rolePlans.map((p) => {
                  const isCurrent = sub.plan?.code === p.code && sub.isActive;
                  const isUpgrade = sub.plan && p.price_monthly > sub.plan.price_monthly && sub.isActive;
                  const isDowngrade = sub.plan && p.price_monthly < sub.plan.price_monthly && sub.isActive;

                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-2xl border p-6 transition-all ${
                        isCurrent
                          ? "border-primary/30 bg-primary/5 shadow-lg shadow-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-2.5 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                          Plano atual
                        </span>
                      )}
                      <h3 className="font-display font-semibold text-lg text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{p.description}</p>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="font-display text-3xl font-bold text-foreground">
                          R${(p.price_monthly / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>

                      {/* Feature list from flags */}
                      <ul className="mt-5 space-y-2">
                        {Object.entries(p.feature_flags as Record<string, unknown>).map(([key, val]) => {
                          if (val === false) return null;
                          return (
                            <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              {featureFlagLabel(key, val)}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="mt-6">
                        {isCurrent ? (
                          <Button variant="outline" className="w-full" disabled>
                            Plano atual
                          </Button>
                        ) : sub.isActive && sub.plan ? (
                          <Button
                            variant={isUpgrade ? "gradient" : "outline"}
                            className="w-full gap-2"
                            onClick={() => handleChangePlan(p)}
                            disabled={actionLoading}
                          >
                            {isUpgrade ? <><Zap className="h-4 w-4" /> Fazer upgrade</> : <>Alterar plano</>}
                          </Button>
                        ) : (
                          <Button
                            variant="gradient"
                            className="w-full gap-2"
                            onClick={() => handleSubscribe(p)}
                            disabled={actionLoading}
                          >
                            <ArrowRight className="h-4 w-4" /> Assinar agora
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── PAYMENT HISTORY ─── */}
        {tab === "history" && (
          <div className="space-y-4">
            <h2 className="text-base font-display font-semibold text-foreground">Histórico de pagamentos</h2>

            {sub.payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {sub.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                          p.status === "paid" ? "bg-green-500/10" : p.status === "failed" ? "bg-red-500/10" : "bg-muted"
                        }`}>
                          {p.status === "paid" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : p.status === "failed" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.description || p.payment_type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-display font-bold ${p.status === "paid" ? "text-foreground" : "text-muted-foreground"}`}>
                          R${(p.amount / 100).toFixed(2).replace(".", ",")}
                        </p>
                        <Badge variant="outline" className={`text-[9px] ${
                          p.status === "paid" ? "text-green-500 border-green-500/20" :
                          p.status === "failed" ? "text-red-500 border-red-500/20" :
                          "text-muted-foreground"
                        }`}>
                          {p.status === "paid" ? "Pago" : p.status === "failed" ? "Falhou" : p.status === "refunded" ? "Reembolsado" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

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
