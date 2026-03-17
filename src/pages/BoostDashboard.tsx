import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket, Wallet, History, PlusCircle, BarChart3, TrendingUp,
  Eye, MousePointerClick, Zap, Crown, Gift, Target, Pause, Play,
  CreditCard, ArrowUpRight, Sparkles, Clock, ChevronRight, Shield
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

interface WalletData {
  balance: number;
  is_founder: boolean;
  founder_grants_used: number;
}

const navItems = [
  { label: "Início", path: "/dashboard/mestre", icon: <Crown className="h-4 w-4" /> },
  { label: "Impulsionar", path: "/boost", icon: <Rocket className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
];

const typeLabels: Record<string, { label: string; className: string }> = {
  purchase: { label: "Compra", className: "text-green-500" },
  spend: { label: "Gasto", className: "text-accent" },
  founder_grant: { label: "Founder", className: "text-secondary" },
  refund: { label: "Reembolso", className: "text-primary" },
};

export default function BoostDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("wallet");
  const displayName = user?.user_metadata?.name || "Mestre";

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mesas, setMesas] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Create campaign state
  const [selectedMesa, setSelectedMesa] = useState("");
  const [campaignBudget, setCampaignBudget] = useState(10);
  const [segmentCity, setSegmentCity] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);

    const [walletRes, txRes, campRes, mesasRes] = await Promise.all([
      supabase.from("credit_wallets").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("boost_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("mesas").select("id, title").eq("gm_id", user.id).eq("status", "aberta"),
    ]);

    if (walletRes.data) {
      setWallet({ balance: walletRes.data.balance, is_founder: walletRes.data.is_founder, founder_grants_used: walletRes.data.founder_grants_used });
    } else {
      // Create wallet if it doesn't exist
      const { data } = await supabase.from("credit_wallets").insert({ user_id: user.id, balance: 0 }).select().single();
      if (data) setWallet({ balance: 0, is_founder: false, founder_grants_used: 0 });
    }

    setTransactions((txRes.data as Transaction[]) || []);
    setCampaigns((campRes.data as Campaign[]) || []);
    setMesas(mesasRes.data || []);
    setLoading(false);
  }

  async function handleBuyCredits(credits: number, price: number) {
    if (!user) return;
    // In real app, this would go through Stripe first
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: credits,
      type: "purchase",
      description: `Compra de ${credits} créditos — R$${price}`,
    });
    if (!txError) {
      await supabase.from("credit_wallets").update({ balance: (wallet?.balance || 0) + credits }).eq("user_id", user.id);
      toast({ title: "Créditos adicionados!", description: `+${credits} créditos na sua carteira.` });
      fetchData();
    }
  }

  async function handleCreateCampaign() {
    if (!user || !selectedMesa || campaignBudget <= 0) return;
    const mesa = mesas.find((m) => m.id === selectedMesa);
    if (!mesa) return;
    if ((wallet?.balance || 0) < campaignBudget) {
      toast({ title: "Saldo insuficiente", description: "Compre mais créditos para impulsionar.", variant: "destructive" });
      return;
    }

    const isFounderFree = wallet?.is_founder && (wallet.founder_grants_used || 0) < 3;

    const { error: campError } = await supabase.from("boost_campaigns").insert({
      user_id: user.id,
      target_type: "mesa",
      target_id: selectedMesa,
      target_title: mesa.title,
      budget_credits: isFounderFree ? 0 : campaignBudget,
      is_founder_benefit: isFounderFree || false,
      segment_city: segmentCity || null,
    });

    if (!campError) {
      if (!isFounderFree) {
        await supabase.from("credit_wallets").update({ balance: (wallet?.balance || 0) - campaignBudget }).eq("user_id", user.id);
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: -campaignBudget,
          type: "spend",
          description: `Impulsionamento: ${mesa.title}`,
        });
      } else {
        await supabase.from("credit_wallets").update({ founder_grants_used: (wallet?.founder_grants_used || 0) + 1 }).eq("user_id", user.id);
      }
      toast({ title: "Campanha criada! 🚀", description: isFounderFree ? "Founder Benefit aplicado!" : `${campaignBudget} créditos investidos.` });
      setSelectedMesa("");
      setCampaignBudget(10);
      setSegmentCity("");
      setTab("campaigns");
      fetchData();
    }
  }

  // Aggregate metrics
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalReservations = campaigns.reduce((s, c) => s + c.reservations, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "wallet", label: "Carteira", icon: <Wallet className="h-4 w-4" /> },
    { key: "campaigns", label: "Campanhas", icon: <Rocket className="h-4 w-4" /> },
    { key: "create", label: "Impulsionar", icon: <PlusCircle className="h-4 w-4" /> },
    { key: "metrics", label: "Métricas", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="gm" navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Impulsionamento <Rocket className="h-5 w-5 text-accent" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Destaque suas mesas. Pague por clique. Transparência total.</p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
              <Wallet className="h-4 w-4 text-secondary" />
              <span className="text-sm font-display font-bold text-foreground">{wallet?.balance || 0}</span>
              <span className="text-xs text-muted-foreground">créditos</span>
            </div>
            {wallet?.is_founder && (
              <div className="flex items-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/5 px-3 py-2.5">
                <Gift className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold text-secondary">Founder</span>
              </div>
            )}
          </div>
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

        {/* ─── WALLET ─── */}
        {tab === "wallet" && (
          <div className="space-y-6">
            {/* Balance card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
                <Sparkles className="w-full h-full text-secondary" />
              </div>
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saldo disponível</p>
                <p className="mt-2 text-4xl font-display font-bold text-foreground">{wallet?.balance || 0} <span className="text-lg text-muted-foreground font-normal">créditos</span></p>
                {wallet?.is_founder && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-1.5">
                    <Gift className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-medium text-secondary">
                      Founder: {3 - (wallet.founder_grants_used || 0)} impulsos grátis restantes este mês
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-3">Como funciona o impulsionamento?</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: <CreditCard className="h-5 w-5 text-primary" />, title: "Compre créditos", desc: "Escolha um pacote e adicione créditos à sua carteira." },
                  { icon: <Target className="h-5 w-5 text-accent" />, title: "Impulsione sua mesa", desc: "Campanha de 7 dias com cobrança por clique (CPC)." },
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
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Comprar créditos</h3>
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
                      Comprar
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
                            <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${tx.amount > 0 ? "bg-green-500/10" : "bg-accent/10"}`}>
                              {tx.amount > 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <Rocket className="h-4 w-4 text-accent" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{tx.description || cfg.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-display font-bold ${cfg.className}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
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
              <h2 className="text-base font-display font-semibold text-foreground">Suas Campanhas</h2>
              <Button variant="default" size="sm" className="gap-2" onClick={() => setTab("create")}>
                <PlusCircle className="h-4 w-4" /> Nova campanha
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                <Rocket className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhuma campanha criada.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Impulsione uma mesa para aparecer em destaque.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("create")}>
                  Criar primeira campanha
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
              <h2 className="text-base font-display font-semibold text-foreground">Impulsionar uma Mesa</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sua mesa aparecerá com selo "Patrocinado" por 7 dias. Cobrança por clique.</p>
            </div>

            {wallet?.is_founder && (wallet.founder_grants_used || 0) < 3 && (
              <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 flex items-start gap-3">
                <Gift className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-secondary">Founder Benefit disponível!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Você tem {3 - (wallet.founder_grants_used || 0)} impulsos grátis restantes este mês. Essa campanha será gratuita.</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              {/* Select mesa */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mesa para impulsionar</label>
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

              {/* Budget */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Orçamento (créditos)</label>
                <input
                  type="number"
                  min={1}
                  max={wallet?.balance || 0}
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Saldo atual: {wallet?.balance || 0} créditos</p>
              </div>

              {/* Segment */}
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
                  <span className="text-muted-foreground">Orçamento</span>
                  <span className="font-display font-bold text-foreground">
                    {wallet?.is_founder && (wallet.founder_grants_used || 0) < 3 ? (
                      <span className="text-secondary">Grátis (Founder)</span>
                    ) : (
                      `${campaignBudget} créditos`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destaques</span>
                  <span className="text-xs text-foreground">Selo "Patrocinado" no feed e busca</span>
                </div>
              </div>

              <Button
                variant="default"
                className="w-full gap-2"
                disabled={!selectedMesa || (!wallet?.is_founder && (wallet?.balance || 0) < campaignBudget)}
                onClick={handleCreateCampaign}
              >
                <Rocket className="h-4 w-4" />
                {wallet?.is_founder && (wallet.founder_grants_used || 0) < 3 ? "Impulsionar Grátis (Founder)" : "Impulsionar Mesa"}
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
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Performance por campanha</h3>
              {campaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Sem dados. Crie uma campanha para começar.</p>
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
    active: { label: "Ativa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    paused: { label: "Pausada", className: "bg-secondary/10 text-secondary border-secondary/20" },
    ended: { label: "Encerrada", className: "bg-muted text-muted-foreground border-border" },
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
  };
  const c = cfg[status] || cfg.draft;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${c.className}`}>{c.label}</span>;
}
