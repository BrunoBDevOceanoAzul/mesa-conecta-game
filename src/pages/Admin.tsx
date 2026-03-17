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
  XCircle, Clock, TrendingUp
} from "lucide-react";

type AdminTab = "overview" | "founders" | "eligibility" | "campaigns";

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

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({ members: 0, mesas: 0, gms: 0, stores: 0, activeSubs: 0, activeCampaigns: 0 });
  const [founders, setFounders] = useState<FounderInfo[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    const [profilesRes, mesasRes, subsRes, walletsRes, campaignsRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, name, email, role"),
      supabase.from("mesas").select("id, status"),
      supabase.from("subscriptions").select("*"),
      supabase.from("credit_wallets").select("*"),
      supabase.from("boost_campaigns").select("id, status"),
    ]);

    const profiles = profilesRes.data || [];
    const activeMesas = (mesasRes.data || []).filter((m) => m.status === "aberta");
    const activeSubs = (subsRes.data || []).filter((s) => s.status === "active" && new Date(s.current_period_end) > new Date());
    const activeCampaigns = (campaignsRes.data || []).filter((c) => c.status === "active");

    setStats({
      members: profiles.length,
      mesas: activeMesas.length,
      gms: profiles.filter((p) => p.role === "gm").length,
      stores: profiles.filter((p) => p.role === "store").length,
      activeSubs: activeSubs.length,
      activeCampaigns: activeCampaigns.length,
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
    const subs = subsRes.data || [];
    const eligibles: EligibleUser[] = activeSubs.map((sub) => {
      const profile = profiles.find((p) => p.user_id === sub.user_id);
      return {
        user_id: sub.user_id,
        name: profile?.name || null,
        email: profile?.email || null,
        role: profile?.role || sub.plan_role,
        plan_name: sub.plan_name,
        plan_status: sub.status,
        plan_end: sub.current_period_end,
      };
    });
    setEligibleUsers(eligibles);

    setLoading(false);
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Visão Geral", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "founders", label: "Founders", icon: <Gift className="h-4 w-4" /> },
    { key: "eligibility", label: "Elegibilidade", icon: <Sparkles className="h-4 w-4" /> },
    { key: "campaigns", label: "Destaques", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Centro de Operações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestão centralizada da plataforma HIVIUM.</p>
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
                <p className="text-xs text-muted-foreground/70 mt-1">Founders serão identificados automaticamente entre os 10 primeiros mestres com plano ativo.</p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eligibleUsers.map((eu) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── CAMPAIGNS OVERVIEW ─── */}
        {tab === "campaigns" && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-display font-semibold text-foreground mb-2">Visão de destaques</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Painel de campanhas de destaque ativas na plataforma. Métricas agregadas e moderação em breve.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
