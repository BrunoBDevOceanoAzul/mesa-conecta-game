import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, Settings, BarChart3, Crown, Store, Gift,
  Sparkles, Calendar, Eye, CreditCard, ChevronDown, CheckCircle2,
  XCircle, Clock, TrendingUp, ToggleLeft, ToggleRight, MousePointerClick,
  Trophy, Star, Zap, Plus
} from "lucide-react";
import { RARITY_CONFIG, CATEGORY_LABELS, XP_TIERS } from "@/lib/xp-config";
import { GamificationConfig } from "@/components/admin/GamificationConfig";
import { CouponManager } from "@/components/admin/CouponManager";
import { GoLiveChecklist } from "@/components/admin/GoLiveChecklist";
import { StoreManager } from "@/components/admin/StoreManager";

type AdminTab = "overview" | "founders" | "eligibility" | "campaigns" | "billing" | "gamification" | "coupons" | "stores" | "golive";

const navItems = [
  { label: "Painel", path: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Usuários", path: "/admin", icon: <Users className="h-4 w-4" /> },
  { label: "Configurações", path: "/admin", icon: <Settings className="h-4 w-4" /> },
];

interface FounderInfo {
  user_id: string;
  email: string | null;
  name: string | null;
  founder_rank: number | null;
  is_founder: boolean;
  founder_started_at: string | null;
  founder_expires_at: string | null;
  free_boosts_per_month: number;
  free_boosts_used_current_month: number;
  balance: number;
}

interface EligibleUser {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  plan_name: string | null;
  plan_status: string | null;
  plan_end: string | null;
}

interface CampaignOverview {
  id: string;
  target_title: string;
  target_type: string;
  status: string;
  impressions: number;
  clicks: number;
  reservations: number;
  budget_credits: number;
  spent_credits: number;
  is_founder_benefit: boolean;
  starts_at: string;
  ends_at: string;
  user_name: string | null;
  user_role: string | null;
}

interface XpRanking {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_title: string;
  name: string | null;
  email: string | null;
  badge_count: number;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({ members: 0, mesas: 0, gms: 0, stores: 0, activeSubs: 0, activeCampaigns: 0, mrr: 0, mrrByRole: {} as Record<string, number>, canceledSubs: 0, pastDueSubs: 0 });
  const [founders, setFounders] = useState<FounderInfo[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<CampaignOverview[]>([]);
  const [xpRanking, setXpRanking] = useState<XpRanking[]>([]);
  const [badgeDefs, setBadgeDefs] = useState<any[]>([]);
  const [awardUserId, setAwardUserId] = useState("");
  const [awardBadgeId, setAwardBadgeId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    const [profilesRes, mesasRes, subsRes, walletsRes, campaignsRes, xpRes, masterBadgesRes, badgeDefsRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, name, email, role"),
      supabase.from("mesas").select("id, status"),
      supabase.from("subscriptions").select("*"),
      supabase.from("credit_wallets").select("*"),
      supabase.from("boost_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("master_xp_profiles").select("*").order("total_xp", { ascending: false }),
      supabase.from("master_badges").select("*"),
      supabase.from("badge_definitions").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const allSubs = subsRes.data || [];
    const activeMesas = (mesasRes.data || []).filter((m) => m.status === "aberta");
    const activeSubs = allSubs.filter((s) => s.status === "active" && new Date(s.current_period_end) > new Date());
    const canceledSubs = allSubs.filter((s) => s.status === "canceled").length;
    const pastDueSubs = allSubs.filter((s) => s.status === "past_due").length;
    const campaigns = campaignsRes.data || [];
    const activeCampaigns = campaigns.filter((c) => c.status === "active");

    // MRR calculation
    const mrr = activeSubs.reduce((sum, s) => sum + (s.price_cents || 0), 0);
    const mrrByRole: Record<string, number> = {};
    activeSubs.forEach((s) => {
      const role = s.plan_role || "unknown";
      mrrByRole[role] = (mrrByRole[role] || 0) + (s.price_cents || 0);
    });

    setStats({
      members: profiles.length,
      mesas: activeMesas.length,
      gms: profiles.filter((p) => p.role === "gm").length,
      stores: profiles.filter((p) => p.role === "store").length,
      activeSubs: activeSubs.length,
      activeCampaigns: activeCampaigns.length,
      mrr,
      mrrByRole,
      canceledSubs,
      pastDueSubs,
    });

    // Founders
    const wallets = walletsRes.data || [];
    const founderWallets = wallets.filter((w) => w.is_founder);
    const founderInfos: FounderInfo[] = founderWallets.map((w) => {
      const profile = profiles.find((p) => p.user_id === w.user_id);
      return {
        user_id: w.user_id,
        email: profile?.email || null,
        name: profile?.name || null,
        founder_rank: w.founder_rank,
        is_founder: w.is_founder,
        founder_started_at: w.founder_started_at,
        founder_expires_at: w.founder_expires_at,
        free_boosts_per_month: w.free_boosts_per_month,
        free_boosts_used_current_month: w.free_boosts_used_current_month,
        balance: w.balance,
      };
    });
    setFounders(founderInfos.sort((a, b) => (a.founder_rank || 999) - (b.founder_rank || 999)));

    // Eligible users (GMs and Stores with active subscriptions)
    const eligibles: EligibleUser[] = activeSubs
      .map((sub) => {
        const profile = profiles.find((p) => p.user_id === sub.user_id);
        const role = profile?.role || sub.plan_role;
        if (role !== "gm" && role !== "store") return null;
        return {
          user_id: sub.user_id,
          name: profile?.name || null,
          email: profile?.email || null,
          role,
          plan_name: sub.plan_name,
          plan_status: sub.status,
          plan_end: sub.current_period_end,
        };
      })
      .filter(Boolean) as EligibleUser[];
    setEligibleUsers(eligibles);

    // All campaigns with user info
    const campaignOverviews: CampaignOverview[] = campaigns.map((c) => {
      const profile = profiles.find((p) => p.user_id === c.user_id);
      return {
        id: c.id,
        target_title: c.target_title,
        target_type: c.target_type,
        status: c.status,
        impressions: c.impressions,
        clicks: c.clicks,
        reservations: c.reservations,
        budget_credits: c.budget_credits,
        spent_credits: c.spent_credits,
        is_founder_benefit: c.is_founder_benefit,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        user_name: profile?.name || null,
        user_role: profile?.role || null,
      };
    });
    setAllCampaigns(campaignOverviews);

    // XP Ranking
    const xpProfiles = xpRes.data || [];
    const allBadges = (masterBadgesRes.data || []) as any[];
    const defs = badgeDefsRes.data || [];
    setBadgeDefs(defs as any[]);
    const ranking: XpRanking[] = (xpProfiles as any[]).map((xp) => {
      const profile = profiles.find((p) => p.user_id === xp.user_id);
      const userBadges = allBadges.filter((b) => b.user_id === xp.user_id);
      return {
        user_id: xp.user_id,
        total_xp: xp.total_xp,
        current_level: xp.current_level,
        current_title: xp.current_title,
        name: profile?.name || null,
        email: profile?.email || null,
        badge_count: userBadges.length,
      };
    });
    setXpRanking(ranking);

    setLoading(false);
  }

  async function awardBadgeManually() {
    if (!awardUserId || !awardBadgeId) return;
    const { error } = await supabase.from("master_badges").insert({
      user_id: awardUserId,
      badge_definition_id: awardBadgeId,
      awarded_reason: "Concedido manualmente pelo admin",
      source_type: "admin",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Badge concedido!", description: "Badge atribuído com sucesso." });
      setAwardUserId("");
      setAwardBadgeId("");
      fetchAdminData();
    }
  }

  async function adjustXp(userId: string, amount: number) {
    const profile = xpRanking.find((x) => x.user_id === userId);
    if (!profile) return;
    const newTotal = Math.max(0, profile.total_xp + amount);
    const tier = XP_TIERS.find((t) => newTotal >= t.minXp && newTotal <= (t.maxXp === Infinity ? 999999 : t.maxXp)) || XP_TIERS[0];
    
    await supabase.from("master_xp_profiles").update({
      total_xp: newTotal,
      current_level: tier.level,
      current_title: tier.title,
    }).eq("user_id", userId);

    if (amount > 0) {
      await supabase.from("xp_events").insert({
        user_id: userId,
        action_type: "admin_grant",
        xp_amount: amount,
      });
    }

    toast({ title: "XP ajustado", description: `${amount > 0 ? "+" : ""}${amount} XP aplicado.` });
    fetchAdminData();
  }

  async function toggleFounderStatus(userId: string, currentlyFounder: boolean) {
    if (currentlyFounder) {
      // Deactivate
      await supabase.from("credit_wallets").update({
        is_founder: false,
        founder_rank: null,
        founder_started_at: null,
        founder_expires_at: null,
        free_boosts_per_month: 0,
        free_boosts_used_current_month: 0,
      }).eq("user_id", userId);
      toast({ title: "Founder desativado", description: "Benefício founder removido do mestre." });
    } else {
      // Activate — assign next rank
      const nextRank = founders.length > 0 ? Math.max(...founders.map((f) => f.founder_rank || 0)) + 1 : 1;
      if (nextRank > 10) {
        toast({ title: "Limite atingido", description: "Já existem 10 founders registrados.", variant: "destructive" });
        return;
      }
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      // Ensure wallet exists
      const { data: existingWallet } = await supabase.from("credit_wallets").select("id").eq("user_id", userId).maybeSingle();
      if (existingWallet) {
        await supabase.from("credit_wallets").update({
          is_founder: true,
          founder_rank: nextRank,
          founder_started_at: now.toISOString(),
          founder_expires_at: expiresAt.toISOString(),
          free_boosts_per_month: 2,
          free_boosts_used_current_month: 0,
          last_month_reset: now.toISOString(),
        }).eq("user_id", userId);
      } else {
        await supabase.from("credit_wallets").insert({
          user_id: userId,
          is_founder: true,
          founder_rank: nextRank,
          founder_started_at: now.toISOString(),
          founder_expires_at: expiresAt.toISOString(),
          free_boosts_per_month: 2,
          free_boosts_used_current_month: 0,
          last_month_reset: now.toISOString(),
        });
      }
      toast({ title: "Founder ativado!", description: `Mestre agora é Founder #${nextRank}.` });
    }
    fetchAdminData();
  }

  const totalCampaignImpressions = allCampaigns.reduce((s, c) => s + c.impressions, 0);
  const totalCampaignClicks = allCampaigns.reduce((s, c) => s + c.clicks, 0);
  const totalCampaignReservations = allCampaigns.reduce((s, c) => s + c.reservations, 0);
  const platformCTR = totalCampaignImpressions > 0 ? ((totalCampaignClicks / totalCampaignImpressions) * 100).toFixed(1) : "0.0";

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Visão Geral", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "billing", label: "Receita", icon: <CreditCard className="h-4 w-4" /> },
    { key: "coupons", label: "Cupons", icon: <Gift className="h-4 w-4" /> },
    { key: "gamification", label: "Gamificação", icon: <Trophy className="h-4 w-4" /> },
    { key: "founders", label: "Founders", icon: <Gift className="h-4 w-4" /> },
    { key: "eligibility", label: "Elegibilidade", icon: <Sparkles className="h-4 w-4" /> },
    { key: "campaigns", label: "Destaques", icon: <TrendingUp className="h-4 w-4" /> },
    { key: "stores", label: "Luderias", icon: <Store className="h-4 w-4" /> },
    { key: "golive", label: "Go-Live", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="admin" navItems={navItems} userName={user?.user_metadata?.name || "Admin"}>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Centro de Operações
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Gestão centralizada da plataforma HIVIUM.</p>
        </div>

        {/* Tabs — mobile: horizontal scroll snap */}
        <div className="relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-all whitespace-nowrap snap-center min-h-[44px] ${
                  tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Membros", value: String(stats.members), icon: <Users className="h-5 w-5 text-primary" /> },
                { label: "Mestres", value: String(stats.gms), icon: <Crown className="h-5 w-5 text-secondary" /> },
                { label: "Luderias", value: String(stats.stores), icon: <Store className="h-5 w-5 text-accent" /> },
                { label: "Mesas ativas", value: String(stats.mesas), icon: <Calendar className="h-5 w-5 text-primary" /> },
                { label: "Assinaturas", value: String(stats.activeSubs), icon: <CreditCard className="h-5 w-5 text-secondary" /> },
                { label: "Destaques ativos", value: String(stats.activeCampaigns), icon: <Sparkles className="h-5 w-5 text-accent" /> },
              ].map((s) => (
                <div key={s.label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <div className="text-2xl font-display font-bold text-foreground mt-2">{s.value}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {s.icon}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── BILLING / REVENUE ─── */}
        {tab === "billing" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "MRR Total", value: `R$${(stats.mrr / 100).toFixed(2).replace(".", ",")}`, icon: <CreditCard className="h-5 w-5 text-primary" /> },
                { label: "Assinaturas Ativas", value: String(stats.activeSubs), icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
                { label: "Canceladas", value: String(stats.canceledSubs), icon: <XCircle className="h-5 w-5 text-orange-500" /> },
                { label: "Inadimplentes", value: String(stats.pastDueSubs), icon: <Clock className="h-5 w-5 text-red-500" /> },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <div className="text-2xl font-display font-bold text-foreground mt-2">{s.value}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* MRR by role */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-4">MRR por perfil</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { role: "gm", label: "Mestres", icon: <Crown className="h-4 w-4 text-secondary" /> },
                  { role: "store", label: "Luderias", icon: <Store className="h-4 w-4 text-accent" /> },
                  { role: "player", label: "Jogadores", icon: <Users className="h-4 w-4 text-primary" /> },
                ].map((r) => (
                  <div key={r.role} className="rounded-lg border border-border p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">{r.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">{r.label}</p>
                      <p className="text-lg font-display font-bold text-foreground">
                        R${((stats.mrrByRole[r.role] || 0) / 100).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── GAMIFICATION ─── */}
        {tab === "gamification" && (
          <div className="space-y-6">
            {/* Config Editor */}
            <GamificationConfig />

            <div className="border-t border-border pt-6" />
            <div>
              <h2 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-secondary" /> Ranking de Mestres por XP
              </h2>
              {xpRanking.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum perfil de XP registrado.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-12">#</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mestre</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nível</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Título</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">XP</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Badges</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {xpRanking.map((r, idx) => (
                        <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-center font-display font-bold text-secondary">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{r.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{r.email}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-foreground">{r.current_level}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-[10px]">{r.current_title}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.total_xp}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{r.badge_count}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => adjustXp(r.user_id, 50)}>
                                <Plus className="h-3 w-3" /> 50
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-destructive" onClick={() => adjustXp(r.user_id, -50)}>
                                -50
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Manual Badge Award */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary" /> Conceder Badge Manualmente
              </h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">User ID</label>
                  <input
                    value={awardUserId}
                    onChange={(e) => setAwardUserId(e.target.value)}
                    className="mt-1 block w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="UUID do usuário"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Badge</label>
                  <select
                    value={awardBadgeId}
                    onChange={(e) => setAwardBadgeId(e.target.value)}
                    className="mt-1 block w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecionar badge...</option>
                    {badgeDefs.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.rarity})</option>
                    ))}
                  </select>
                </div>
                <Button variant="hero" size="sm" onClick={awardBadgeManually} disabled={!awardUserId || !awardBadgeId}>
                  <Gift className="h-4 w-4" /> Conceder
                </Button>
              </div>
            </div>

            {/* Badge Catalog */}
            <div>
              <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Catálogo de Badges
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badgeDefs.map((d: any) => {
                  const rarity = RARITY_CONFIG[d.rarity] || RARITY_CONFIG.common;
                  return (
                    <div key={d.id} className={`rounded-xl border p-4 bg-gradient-to-br ${rarity.gradient}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-display font-semibold text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${rarity.className}`}>{rarity.label}</Badge>
                      </div>
                      {d.flavor_text && <p className="text-[10px] italic text-muted-foreground/70 mt-2">"{d.flavor_text}"</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[d.category] || d.category}</span>
                        {d.xp_reward > 0 && <span className="text-[10px] font-bold text-secondary">+{d.xp_reward} XP</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── FOUNDERS ─── */}
        {tab === "founders" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-foreground">Mestres Founders</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Primeiros 10 mestres elegíveis — 2 destaques grátis/mês por 3 meses.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs gap-1">
                <Gift className="h-3 w-3" /> {founders.length}/10 vagas preenchidas
              </Badge>
            </div>

            {founders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <Gift className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum founder registrado ainda.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Ative founders manualmente na aba Elegibilidade ou automaticamente ao atingir critérios.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mestre</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Início</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiração</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Usados/Mês</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Restantes</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {founders.map((f) => {
                      const expired = f.founder_expires_at ? new Date(f.founder_expires_at) < new Date() : true;
                      const remaining = expired ? 0 : Math.max(0, 2 - f.free_boosts_used_current_month);
                      return (
                        <tr key={f.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-display font-bold text-secondary">{f.founder_rank || "—"}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{f.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{f.email}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                            {f.founder_started_at ? new Date(f.founder_started_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                            {f.founder_expires_at ? new Date(f.founder_expires_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{f.free_boosts_used_current_month}/2</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${remaining > 0 ? "text-secondary" : "text-muted-foreground"}`}>{remaining}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {expired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                <XCircle className="h-3 w-3" /> Expirado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-500">
                                <CheckCircle2 className="h-3 w-3" /> Ativo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => toggleFounderStatus(f.user_id, true)}
                            >
                              <ToggleRight className="h-3.5 w-3.5" /> Desativar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── ELIGIBILITY ─── */}
        {tab === "eligibility" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">Usuários Aptos ao Destaque</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mestres e Luderias com assinatura ativa que podem destacar conteúdo.</p>
            </div>

            {eligibleUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum assinante ativo no momento.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Plano</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Válido até</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Founder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eligibleUsers.map((eu) => {
                      const isFounder = founders.some((f) => f.user_id === eu.user_id);
                      const canBeFounder = eu.role === "gm" && !isFounder && founders.length < 10;
                      return (
                        <tr key={eu.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{eu.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{eu.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={eu.role === "gm" ? "default" : "secondary"} className="text-[10px]">
                              {eu.role === "gm" ? "Mestre" : eu.role === "store" ? "Luderia" : eu.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{eu.plan_name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                            {eu.plan_end ? new Date(eu.plan_end).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-500">
                              <CheckCircle2 className="h-3 w-3" /> Elegível
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {eu.role === "gm" ? (
                              isFounder ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary">
                                  <Gift className="h-3 w-3" /> Founder
                                </span>
                              ) : canBeFounder ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs gap-1 text-secondary hover:text-secondary"
                                  onClick={() => toggleFounderStatus(eu.user_id, false)}
                                >
                                  <ToggleLeft className="h-3.5 w-3.5" /> Ativar
                                </Button>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Vagas cheias</span>
                              )
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── CAMPAIGNS OVERVIEW ─── */}
        {tab === "campaigns" && (
          <div className="space-y-5">
            {/* Aggregated metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Destaques", value: String(allCampaigns.length), icon: <Sparkles className="h-5 w-5 text-accent" /> },
                { label: "Impressões", value: String(totalCampaignImpressions), icon: <Eye className="h-5 w-5 text-primary" /> },
                { label: "Cliques", value: String(totalCampaignClicks), icon: <MousePointerClick className="h-5 w-5 text-secondary" /> },
                { label: "CTR Plataforma", value: `${platformCTR}%`, icon: <TrendingUp className="h-5 w-5 text-accent" /> },
              ].map((s) => (
                <div key={s.label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <div className="text-2xl font-display font-bold text-foreground mt-2">{s.value}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign list */}
            {allCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma campanha de destaque registrada.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campanha</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Responsável</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Impressões</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cliques</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Reservas</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Período</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allCampaigns.map((c) => {
                      const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
                      const statusCfg: Record<string, { label: string; cls: string }> = {
                        active: { label: "Ativo", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
                        paused: { label: "Pausado", cls: "bg-secondary/10 text-secondary border-secondary/20" },
                        ended: { label: "Encerrado", cls: "bg-muted text-muted-foreground border-border" },
                      };
                      const sc = statusCfg[c.status] || statusCfg.ended;
                      return (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {c.is_founder_benefit && <Gift className="h-3.5 w-3.5 text-secondary shrink-0" />}
                              <span className="font-medium text-foreground truncate max-w-[180px]">{c.target_title}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{c.target_type === "mesa" ? "Mesa" : "Publicação"}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-xs text-foreground">{c.user_name || "—"}</p>
                            <Badge variant={c.user_role === "gm" ? "default" : "secondary"} className="text-[9px] mt-0.5">
                              {c.user_role === "gm" ? "Mestre" : "Luderia"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc.cls}`}>{sc.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium hidden md:table-cell">{c.impressions}</td>
                          <td className="px-4 py-3 text-right font-medium hidden md:table-cell">{c.clicks}</td>
                          <td className="px-4 py-3 text-right font-medium">{ctr}%</td>
                          <td className="px-4 py-3 text-right font-medium hidden lg:table-cell">{c.reservations}</td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(c.starts_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {new Date(c.ends_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── COUPONS ─── */}
        {tab === "coupons" && (
          <CouponManager />
        )}

        {/* ─── STORES ─── */}
        {tab === "stores" && (
          <StoreManager />
        )}

        {/* ─── GO-LIVE CHECKLIST ─── */}
        {tab === "golive" && (
          <GoLiveChecklist />
        )}
      </div>
    </DashboardLayout>
  );
}