import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBoostEligibility } from "@/hooks/use-boost-eligibility";
import { BoostGateCard } from "@/components/boost/BoostGateCard";
import {
  Rocket, Wallet, History, PlusCircle, BarChart3, TrendingUp,
  Eye, MousePointerClick, Zap, Crown, Gift, Target, Pause, Play,
  CreditCard, ArrowUpRight, Sparkles, Clock, ChevronRight, Shield,
  Store, Lock
} from "lucide-react";
import { creditPackages } from "@/data/mock";

type Tab = "wallet" | "campaigns" | "create" | "metrics";

interface Campaign {
  id: string;
  target_type: string;
  target_id: string;
  target_title: string;
  status: string;
  budget_credits: number;
  spent_credits: number;
  cpc_rate: number;
  impressions: number;
  clicks: number;
  reservations: number;
  segment_city: string | null;
  segment_systems: string[] | null;
  segment_interests: string[] | null;
  is_founder_benefit: boolean;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

const typeLabels: Record<string, { label: string; className: string }> = {
  purchase: { label: "Compra", className: "text-green-500" },
  spend: { label: "Destaque", className: "text-accent" },
  founder_grant: { label: "Founder", className: "text-secondary" },
  refund: { label: "Reembolso", className: "text-primary" },
};

export default function BoostDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const eligibility = useBoostEligibility();
  const [tab, setTab] = useState<Tab>("wallet");
  const displayName = user?.user_metadata?.name || "Usuário";

  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mesas, setMesas] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Create campaign state
  const [selectedMesa, setSelectedMesa] = useState("");
  const [campaignBudget, setCampaignBudget] = useState(10);
  const [segmentCity, setSegmentCity] = useState("");

  const isGm = eligibility.userRole === "gm";
  const isStore = eligibility.userRole === "store";

  const navItems = [
    { label: "Início", path: isStore ? "/dashboard/loja" : "/dashboard/mestre", icon: isStore ? <Store className="h-4 w-4" /> : <Crown className="h-4 w-4" /> },
    { label: "Destaque", path: "/boost", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (!user || !eligibility.canBoost) return;
    fetchData();
  }, [user, eligibility.canBoost]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);

    const [walletRes, txRes, campRes] = await Promise.all([
      supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("boost_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    // For stores, first find the store then query mesas by store.id
    let mesasData: { id: string; title: string }[] = [];
    if (isGm) {
      const { data } = await supabase.from("mesas").select("id, title").eq("gm_id", user.id).eq("status", "aberta");
      mesasData = data || [];
    } else if (isStore) {
      const { data: storeData } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
      if (storeData) {
        const { data } = await supabase.from("mesas").select("id, title").eq("store_id", storeData.id).eq("status", "aberta");
        mesasData = data || [];
      }
    }

    setWalletBalance(walletRes.data?.balance || 0);
    setTransactions((txRes.data as Transaction[]) || []);
    setCampaigns((campRes.data as Campaign[]) || []);
    setMesas(mesasData);
    setLoading(false);
  }

  async function handleBuyCredits(credits: number, price: number) {
    if (!user) return;
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: credits,
      type: "purchase",
      description: `Compra de ${credits} créditos — R$${price}`,
    });
    if (!txError) {
      await supabase.from("credit_wallets").update({ balance: walletBalance + credits }).eq("user_id", user.id);
      toast({ title: "Créditos adicionados!", description: `+${credits} créditos na sua carteira.` });
      fetchData();
      eligibility.refresh();
    }
  }

  async function handleCreateCampaign() {
    if (!user || !selectedMesa || !eligibility.canBoost) return;
    const mesa = mesas.find((m) => m.id === selectedMesa);
    if (!mesa) return;

    const useFounderFree = eligibility.status === "eligible_founder_free";

    if (!useFounderFree && walletBalance < campaignBudget) {
      toast({ title: "Saldo insuficiente", description: "Adquira mais créditos para destacar.", variant: "destructive" });
      return;
    }

    const campaignSource = useFounderFree ? "founder_free" : "paid_credit";

    const { data: campData, error: campError } = await supabase.from("boost_campaigns").insert({
      user_id: user.id,
      target_type: "mesa",
      target_id: selectedMesa,
      target_title: mesa.title,
      budget_credits: useFounderFree ? 0 : campaignBudget,
      is_founder_benefit: useFounderFree,
      campaign_source: campaignSource,
      duration_days: 7,
      segment_city: segmentCity || null,
    }).select("id").single();

    if (!campError && campData) {
      // Log usage
      await supabase.from("boost_usage_logs").insert({
        user_id: user.id,
        boost_campaign_id: campData.id,
        usage_type: useFounderFree ? "free_monthly_boost" : "paid_boost",
        credits_spent: useFounderFree ? 0 : campaignBudget,
        founder_benefit_used: useFounderFree,
      });

      if (useFounderFree) {
        // Increment founder usage
        const currentUsed = await supabase.from("credit_wallets").select("free_boosts_used_current_month").eq("user_id", user.id).maybeSingle();
        await supabase.from("credit_wallets").update({
          free_boosts_used_current_month: (currentUsed.data?.free_boosts_used_current_month || 0) + 1,
        }).eq("user_id", user.id);
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: 0,
          type: "founder_grant",
          description: `Destaque Founder: ${mesa.title}`,
          reference_id: campData.id,
        });
      } else {
        await supabase.from("credit_wallets").update({ balance: walletBalance - campaignBudget }).eq("user_id", user.id);
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: -campaignBudget,
          type: "spend",
          description: `Destaque: ${mesa.title}`,
          reference_id: campData.id,
        });
      }
      toast({ title: "Destaque ativado! ✨", description: useFounderFree ? "Benefício Founder aplicado!" : `${campaignBudget} créditos investidos.` });
      setSelectedMesa("");
      setCampaignBudget(10);
      setSegmentCity("");
      setTab("campaigns");
      fetchData();
      eligibility.refresh();
    } else if (campError) {
      toast({ title: "Erro ao ativar destaque", description: campError.message, variant: "destructive" });
    }
  }

  // Aggregate metrics
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalReservations = campaigns.reduce((s, c) => s + c.reservations, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "wallet", label: "Carteira", icon: <Wallet className="h-4 w-4" /> },
    { key: "campaigns", label: "Campanhas", icon: <Sparkles className="h-4 w-4" /> },
    { key: "create", label: "Dar destaque", icon: <PlusCircle className="h-4 w-4" /> },
    { key: "metrics", label: "Métricas", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // ─── NOT ELIGIBLE ───
  if (!eligibility.loading && eligibility.status === "not_eligible") {
    return (
      <DashboardLayout role="player" navItems={[]} userName={displayName}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Recurso restrito</h2>
            <p className="text-sm text-muted-foreground">
              O destaque de conteúdo está disponível exclusivamente para Mestres e Luderias com plano ativo.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── NO PLAN ───
  if (!eligibility.loading && eligibility.status === "no_plan") {
    return (
      <DashboardLayout role={isStore ? "store" : "gm"} navItems={navItems} userName={displayName}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Destaque <Sparkles className="h-5 w-5 text-accent" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ganhe visibilidade para suas mesas e publicações.</p>
          </div>
          <BoostGateCard
            status={eligibility.status}
            userRole={eligibility.userRole}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ─── MAIN DASHBOARD (eligible) ───
  return (
    <DashboardLayout role={isStore ? "store" : "gm"} navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Destaque <Sparkles className="h-5 w-5 text-accent" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Dê visibilidade às suas mesas. Pague por clique. Transparência total.</p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
              <Wallet className="h-4 w-4 text-secondary" />
              <span className="text-sm font-display font-bold text-foreground">{walletBalance}</span>
              <span className="text-xs text-muted-foreground">créditos</span>
            </div>
            {eligibility.isFounder && (
              <div className="flex items-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/5 px-3 py-2.5">
                <Gift className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold text-secondary">Founder</span>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility status card */}
        <BoostGateCard
          status={eligibility.status}
          userRole={eligibility.userRole}
          founderFreeRemaining={eligibility.founderFreeRemaining}
          founderExpiresAt={eligibility.founderExpiresAt}
          planName={eligibility.planName}
        />

        {/* Tabs */}
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

        {/* ─── WALLET ─── */}
        {tab === "wallet" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
                <Sparkles className="w-full h-full text-secondary" />
              </div>
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saldo disponível</p>
                <p className="mt-2 text-4xl font-display font-bold text-foreground">{walletBalance} <span className="text-lg text-muted-foreground font-normal">créditos</span></p>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-3">Como funciona o destaque?</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: <CreditCard className="h-5 w-5 text-primary" />, title: "Adquira créditos", desc: "Escolha um pacote e adicione créditos à sua carteira." },
                  { icon: <Target className="h-5 w-5 text-accent" />, title: "Destaque sua mesa", desc: "Campanha de 7 dias com cobrança por clique (CPC)." },
                  { icon: <BarChart3 className="h-5 w-5 text-secondary" />, title: "Acompanhe resultados", desc: "Impressões, cliques, CTR e reservas em tempo real." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit packages */}
            <div>
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Adquirir créditos</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {creditPackages.map((pkg, i) => (
                  <div
                    key={pkg.price}
                    className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                      i === 1 ? "border-accent/40 bg-card shadow-md shadow-accent/5" : "border-border bg-card/70"
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-accent-foreground">
                        {pkg.badge}
                      </span>
                    )}
                    <div className="text-center mb-4">
                      <p className="text-3xl font-display font-bold text-foreground">{pkg.credits}</p>
                      <p className="text-xs text-muted-foreground">créditos</p>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-xl font-display font-bold text-foreground">R${pkg.price},00</p>
                      <p className="text-[10px] text-muted-foreground">R${(pkg.price / pkg.credits).toFixed(2).replace(".", ",")}/crédito</p>
                    </div>
                    <Button
                      variant={i === 1 ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleBuyCredits(pkg.credits, pkg.price)}
                    >
                      Adquirir
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div>
              <h3 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Histórico
              </h3>
              {transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <History className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {transactions.slice(0, 15).map((tx) => {
                      const cfg = typeLabels[tx.type] || { label: tx.type, className: "text-foreground" };
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${tx.amount > 0 ? "bg-green-500/10" : tx.type === "founder_grant" ? "bg-secondary/10" : "bg-accent/10"}`}>
                              {tx.type === "founder_grant" ? <Gift className="h-4 w-4 text-secondary" /> : tx.amount > 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <Sparkles className="h-4 w-4 text-accent" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{tx.description || cfg.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-display font-bold ${cfg.className}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount === 0 ? "Grátis" : tx.amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CAMPAIGNS ─── */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-foreground">Seus Destaques</h2>
              <Button variant="default" size="sm" className="gap-2" onClick={() => setTab("create")}>
                <PlusCircle className="h-4 w-4" /> Novo destaque
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum destaque ativo.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Destaque uma mesa para ganhar visibilidade.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("create")}>
                  Criar primeiro destaque
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <CampaignCard key={camp.id} campaign={camp} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CREATE CAMPAIGN ─── */}
        {tab === "create" && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">Destacar uma Mesa</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sua mesa aparecerá com selo "Destaque" por 7 dias. Cobrança por clique.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mesa para destacar</label>
                {mesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma mesa ativa. Crie uma mesa primeiro.</p>
                ) : (
                  <select
                    value={selectedMesa}
                    onChange={(e) => setSelectedMesa(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione uma mesa...</option>
                    {mesas.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {eligibility.status !== "eligible_founder_free" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Orçamento (créditos)</label>
                  <input
                    type="number"
                    min={1}
                    max={walletBalance}
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Saldo atual: {walletBalance} créditos</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Segmentar por cidade (opcional)</label>
                <input
                  type="text"
                  value={segmentCity}
                  onChange={(e) => setSegmentCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium text-foreground">7 dias</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modelo</span>
                  <span className="font-medium text-foreground">CPC (por clique)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Investimento</span>
                  <span className="font-display font-bold text-foreground">
                    {eligibility.status === "eligible_founder_free" ? (
                      <span className="text-secondary">Gratuito (Founder)</span>
                    ) : (
                      `${campaignBudget} créditos`
                    )}
                  </span>
                </div>
              </div>

              <Button
                variant="default"
                className="w-full gap-2"
                disabled={!selectedMesa || (eligibility.status !== "eligible_founder_free" && walletBalance < campaignBudget)}
                onClick={handleCreateCampaign}
              >
                <Sparkles className="h-4 w-4" />
                {eligibility.status === "eligible_founder_free" ? "Destacar Grátis (Founder)" : "Ativar Destaque"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── METRICS ─── */}
        {tab === "metrics" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={<Eye className="h-5 w-5" />} label="Impressões" value={String(totalImpressions)} />
              <MetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Cliques" value={String(totalClicks)} />
              <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="CTR" value={`${avgCTR}%`} />
              <MetricCard icon={<Zap className="h-5 w-5" />} label="Reservas" value={String(totalReservations)} />
            </div>

            <div>
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Performance por destaque</h3>
              {campaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Sem dados. Crie um destaque para começar.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campanha</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Impressões</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliques</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">CTR</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Reservas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {campaigns.map((c) => {
                        const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {c.is_founder_benefit && <Gift className="h-3.5 w-3.5 text-secondary shrink-0" />}
                                <span className="font-medium text-foreground truncate max-w-[200px]">{c.target_title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <CampaignStatusBadge status={c.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-medium hidden sm:table-cell">{c.impressions}</td>
                            <td className="px-4 py-3 text-right font-medium hidden sm:table-cell">{c.clicks}</td>
                            <td className="px-4 py-3 text-right font-medium">{ctr}%</td>
                            <td className="px-4 py-3 text-right font-medium hidden md:table-cell">{c.reservations}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Sub-components ── */

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-display font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1) : "0.0";
  const spentPct = campaign.budget_credits > 0 ? Math.round((campaign.spent_credits / campaign.budget_credits) * 100) : 0;
  const endsAt = new Date(campaign.ends_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {campaign.is_founder_benefit && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Gift className="h-3 w-3" /> Founder
              </Badge>
            )}
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-1.5 truncate">{campaign.target_title}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Encerra em {endsAt}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-lg font-display font-bold text-foreground">{campaign.impressions}</p>
          <p className="text-[10px] text-muted-foreground">Impressões</p>
        </div>
        <div>
          <p className="text-lg font-display font-bold text-foreground">{campaign.clicks}</p>
          <p className="text-[10px] text-muted-foreground">Cliques</p>
        </div>
        <div>
          <p className="text-lg font-display font-bold text-foreground">{ctr}%</p>
          <p className="text-[10px] text-muted-foreground">CTR</p>
        </div>
        <div>
          <p className="text-lg font-display font-bold text-foreground">{campaign.reservations}</p>
          <p className="text-[10px] text-muted-foreground">Reservas</p>
        </div>
      </div>

      {campaign.budget_credits > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${spentPct}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{campaign.spent_credits}/{campaign.budget_credits}</span>
        </div>
      )}
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    paused: { label: "Pausado", className: "bg-secondary/10 text-secondary border-secondary/20" },
    ended: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border" },
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
  };
  const c = cfg[status] || cfg.draft;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${c.className}`}>{c.label}</span>;
}
