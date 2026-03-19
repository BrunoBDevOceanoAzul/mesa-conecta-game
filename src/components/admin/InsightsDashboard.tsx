import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Crown, Store, Calendar, CreditCard, Sparkles,
  TrendingUp, TrendingDown, AlertTriangle, Target, Lightbulb,
  MapPin, Clock, DollarSign, Gamepad2, Layers, BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface InsightsData {
  totalUsers: number;
  totalPlayers: number;
  totalGMs: number;
  totalStores: number;
  totalTables: number;
  totalBookings: number;
  activeSubs: number;
  onboardingRate: number;
  newUsersLast30: number;
  // Demand
  topSystems: { name: string; count: number }[];
  topFormats: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
  budgetDistribution: { name: string; count: number }[];
  experienceLevels: { name: string; count: number }[];
  // Supply
  gmSystems: { name: string; count: number }[];
  gmPriceRanges: { name: string; count: number }[];
  gmCities: { name: string; count: number }[];
  tableFormats: { name: string; count: number }[];
  // Gaps
  gaps: { title: string; description: string; severity: "high" | "medium" | "low" }[];
  // Opportunities
  opportunities: { title: string; description: string; action: string }[];
  // Clusters
  playerClusters: { name: string; description: string; count: number; color: string }[];
  gmClusters: { name: string; description: string; count: number; color: string }[];
}

const CHART_COLORS = [
  "hsl(270, 52%, 48%)", "hsl(42, 78%, 50%)", "hsl(152, 56%, 42%)",
  "hsl(210, 60%, 52%)", "hsl(320, 50%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(180, 50%, 45%)", "hsl(0, 68%, 48%)"
];

function countJsonArray(items: any[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const val = item[key];
    if (Array.isArray(val)) {
      val.forEach((v: string) => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    } else if (typeof val === "string" && val) {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return counts;
}

function toRanked(counts: Record<string, number>, limit = 8): { name: string; count: number }[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function budgetRange(min: number | null, max: number | null): string {
  const avg = ((min || 0) + (max || 0)) / 2;
  if (avg <= 20) return "Até R$20";
  if (avg <= 40) return "R$20–40";
  if (avg <= 60) return "R$40–60";
  if (avg <= 100) return "R$60–100";
  return "R$100+";
}

export function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoading(true);
    const [profilesRes, playerRes, gmRes, tablesRes, bookingsRes, subsRes, onbRes] = await Promise.all([
      supabase.from("profiles").select("user_id, role, city, created_at, onboarding_completed"),
      supabase.from("player_profiles").select("preferred_systems_json, preferred_styles_json, format_preference, budget_min, budget_max, experience_level, user_id"),
      supabase.from("gm_profiles").select("systems_mastered_json, narrative_style_json, price_min, price_max, beginner_friendly, max_players_default, accepted_formats_json, user_id"),
      supabase.from("game_tables").select("system_name, city, play_format, session_type, seats_total, status, gm_user_id, created_at"),
      supabase.from("bookings").select("id, status, created_at"),
      supabase.from("subscriptions").select("id, status, current_period_end"),
      supabase.from("onboarding_sessions").select("id, completed_at, user_id"),
    ]);

    const profiles = profilesRes.data || [];
    const players = playerRes.data || [];
    const gms = gmRes.data || [];
    const tables = tablesRes.data || [];
    const bookings = bookingsRes.data || [];
    const subs = subsRes.data || [];
    const onbSessions = onbRes.data || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalPlayers = profiles.filter(p => p.role === "player").length;
    const totalGMs = profiles.filter(p => p.role === "gm").length;
    const totalStores = profiles.filter(p => p.role === "store").length;
    const activeSubs = subs.filter(s => s.status === "active" && new Date(s.current_period_end) > now).length;
    const completedOnb = onbSessions.filter(o => o.completed_at).length;
    const onboardingRate = onbSessions.length > 0 ? Math.round((completedOnb / onbSessions.length) * 100) : 0;
    const newUsersLast30 = profiles.filter(p => new Date(p.created_at) > thirtyDaysAgo).length;

    // Demand analysis
    const demandSystems = countJsonArray(players, "preferred_systems_json");
    const demandFormats = countJsonArray(players, "format_preference");
    const playerCities: Record<string, number> = {};
    profiles.filter(p => p.role === "player" && p.city).forEach(p => {
      playerCities[p.city!] = (playerCities[p.city!] || 0) + 1;
    });

    const budgetDist: Record<string, number> = {};
    players.forEach(p => {
      const range = budgetRange(p.budget_min, p.budget_max);
      budgetDist[range] = (budgetDist[range] || 0) + 1;
    });

    const expLevels = countJsonArray(players, "experience_level");

    // Supply analysis
    const supplySystems = countJsonArray(gms, "systems_mastered_json");
    const gmPriceDist: Record<string, number> = {};
    gms.forEach(g => {
      const range = budgetRange(g.price_min, g.price_max);
      gmPriceDist[range] = (gmPriceDist[range] || 0) + 1;
    });

    const gmCityCounts: Record<string, number> = {};
    profiles.filter(p => p.role === "gm" && p.city).forEach(p => {
      gmCityCounts[p.city!] = (gmCityCounts[p.city!] || 0) + 1;
    });

    const tableFormatCounts = countJsonArray(tables, "play_format");

    // Gap analysis
    const gaps: InsightsData["gaps"] = [];
    const topDemandSystems = Object.entries(demandSystems).sort((a, b) => b[1] - a[1]).slice(0, 5);
    topDemandSystems.forEach(([sys, demandCount]) => {
      const supplyCount = supplySystems[sys] || 0;
      if (demandCount > supplyCount * 2 && demandCount >= 3) {
        gaps.push({
          title: `Alta demanda por ${sys}`,
          description: `${demandCount} jogadores procuram, mas apenas ${supplyCount} mestre(s) dominam esse sistema.`,
          severity: supplyCount === 0 ? "high" : "medium",
        });
      }
    });

    const topDemandCities = Object.entries(playerCities).sort((a, b) => b[1] - a[1]).slice(0, 5);
    topDemandCities.forEach(([city, demandCount]) => {
      const supplyCount = gmCityCounts[city] || 0;
      if (demandCount > supplyCount * 3 && demandCount >= 3) {
        gaps.push({
          title: `Demanda reprimida em ${city}`,
          description: `${demandCount} jogadores na região, mas apenas ${supplyCount} mestre(s) disponíveis.`,
          severity: supplyCount === 0 ? "high" : "medium",
        });
      }
    });

    const beginnerFriendlyGMs = gms.filter(g => g.beginner_friendly).length;
    const beginnerPlayers = players.filter(p => p.experience_level === "iniciante" || p.experience_level === "beginner").length;
    if (beginnerPlayers > beginnerFriendlyGMs * 2 && beginnerPlayers >= 3) {
      gaps.push({
        title: "Jogadores iniciantes sem suporte suficiente",
        description: `${beginnerPlayers} iniciantes, mas apenas ${beginnerFriendlyGMs} mestres se posicionam como beginner-friendly.`,
        severity: "medium",
      });
    }

    if (gaps.length === 0) {
      gaps.push({
        title: "Dados insuficientes para análise de gaps",
        description: "Mais cadastros são necessários para identificar desbalanços significativos entre oferta e demanda.",
        severity: "low",
      });
    }

    // Opportunities
    const opportunities: InsightsData["opportunities"] = [];
    if (topDemandSystems.length > 0) {
      opportunities.push({
        title: `Recrutar mestres de ${topDemandSystems[0][0]}`,
        description: `Sistema com maior demanda entre jogadores. Campanhas de aquisição focadas nesse nicho tendem a gerar liquidez rápida.`,
        action: "Campanha de aquisição",
      });
    }
    if (topDemandCities.length > 0 && (gmCityCounts[topDemandCities[0][0]] || 0) < topDemandCities[0][1]) {
      opportunities.push({
        title: `Expandir presença em ${topDemandCities[0][0]}`,
        description: `Cidade com maior concentração de jogadores e potencial de crescimento para mestres e lojas.`,
        action: "Expansão regional",
      });
    }
    if (totalGMs > 0 && activeSubs < totalGMs * 0.3) {
      opportunities.push({
        title: "Converter mestres free para Pro",
        description: `Apenas ${activeSubs} assinaturas ativas entre ${totalGMs} mestres. Potencial significativo de conversão com trial ou oferta founder.`,
        action: "Upsell de plano",
      });
    }
    opportunities.push({
      title: "Incentivar destaque para perfis com potencial",
      description: "Mestres com mesas ativas e boa taxa de ocupação são candidatos ideais para boost. Oferecer créditos de teste pode aumentar ARPU.",
      action: "Engajamento via boost",
    });

    // Clusters
    const playerClusters: InsightsData["playerClusters"] = [];
    const beginners = players.filter(p => p.experience_level === "iniciante" || p.experience_level === "beginner");
    const budgetConscious = players.filter(p => (p.budget_max || 0) <= 30);
    const premiumPlayers = players.filter(p => (p.budget_max || 0) >= 80);
    const campaignLovers = players.filter(p => p.format_preference === "campanha" || p.format_preference === "campaign");
    const oneShotCasual = players.filter(p => p.format_preference === "one-shot" || p.format_preference === "one_shot");

    if (beginners.length > 0) playerClusters.push({ name: "Iniciantes Econômicos", description: "Novatos com orçamento limitado buscando primeira experiência", count: beginners.length, color: "bg-info/10 text-info border-info/20" });
    if (premiumPlayers.length > 0) playerClusters.push({ name: "Jogadores Premium", description: "Dispostos a pagar mais por experiências narrativas diferenciadas", count: premiumPlayers.length, color: "bg-secondary/10 text-secondary border-secondary/20" });
    if (campaignLovers.length > 0) playerClusters.push({ name: "Campaign-First", description: "Preferem campanhas longas com arco narrativo contínuo", count: campaignLovers.length, color: "bg-primary/10 text-primary border-primary/20" });
    if (oneShotCasual.length > 0) playerClusters.push({ name: "One-Shot Casual", description: "Buscam sessões independentes sem compromisso de longo prazo", count: oneShotCasual.length, color: "bg-accent/10 text-accent border-accent/20" });
    if (budgetConscious.length > 0 && budgetConscious.length !== beginners.length) playerClusters.push({ name: "Presencial Local", description: "Foco em jogo presencial com orçamento controlado", count: budgetConscious.length, color: "bg-success/10 text-success border-success/20" });

    const gmClusters: InsightsData["gmClusters"] = [];
    const friendlyGMs = gms.filter(g => g.beginner_friendly);
    const highTicketGMs = gms.filter(g => (g.price_max || 0) >= 80);
    const volumeGMs = gms.filter(g => (g.max_players_default || 0) >= 6);
    
    if (friendlyGMs.length > 0) gmClusters.push({ name: "Beginner-Friendly", description: "Mestres focados em acolher jogadores iniciantes", count: friendlyGMs.length, color: "bg-success/10 text-success border-success/20" });
    if (highTicketGMs.length > 0) gmClusters.push({ name: "Premium Narrativo", description: "Mestres com ticket alto e foco em experiências imersivas", count: highTicketGMs.length, color: "bg-secondary/10 text-secondary border-secondary/20" });
    if (volumeGMs.length > 0) gmClusters.push({ name: "Operador de Volume", description: "Mesas grandes, foco em escala e recorrência", count: volumeGMs.length, color: "bg-primary/10 text-primary border-primary/20" });

    setData({
      totalUsers: profiles.length,
      totalPlayers,
      totalGMs,
      totalStores,
      totalTables: tables.length,
      totalBookings: bookings.length,
      activeSubs,
      onboardingRate,
      newUsersLast30,
      topSystems: toRanked(demandSystems),
      topFormats: toRanked(demandFormats),
      topCities: toRanked(playerCities),
      budgetDistribution: toRanked(budgetDist),
      experienceLevels: toRanked(expLevels),
      gmSystems: toRanked(supplySystems),
      gmPriceRanges: toRanked(gmPriceDist),
      gmCities: toRanked(gmCityCounts),
      tableFormats: toRanked(tableFormatCounts),
      gaps,
      opportunities,
      playerClusters,
      gmClusters,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { label: "Total Usuários", value: data.totalUsers, icon: <Users className="h-5 w-5 text-primary" />, sub: `+${data.newUsersLast30} últimos 30d` },
    { label: "Jogadores", value: data.totalPlayers, icon: <Gamepad2 className="h-5 w-5 text-info" /> },
    { label: "Mestres", value: data.totalGMs, icon: <Crown className="h-5 w-5 text-secondary" /> },
    { label: "Lojas", value: data.totalStores, icon: <Store className="h-5 w-5 text-accent" /> },
    { label: "Mesas Criadas", value: data.totalTables, icon: <Calendar className="h-5 w-5 text-primary" /> },
    { label: "Reservas", value: data.totalBookings, icon: <Layers className="h-5 w-5 text-success" /> },
    { label: "Assinaturas Ativas", value: data.activeSubs, icon: <CreditCard className="h-5 w-5 text-secondary" /> },
    { label: "Taxa Onboarding", value: `${data.onboardingRate}%`, icon: <Target className="h-5 w-5 text-info" /> },
  ];

  return (
    <div className="space-y-8">
      {/* BLOCK 1 — Overview */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Visão Geral
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
          {kpis.map((k) => (
            <div key={k.label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">{k.icon}</div>
              </div>
              <div className="text-xl font-display font-bold text-foreground">{k.value}</div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1">{k.label}</p>
              {"sub" in k && k.sub && <p className="text-[10px] text-success mt-0.5">{k.sub}</p>}
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* BLOCK 2 — Demand Insights */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-info" /> Insights da Demanda
          <Badge variant="outline" className="text-[10px] ml-2">Jogadores</Badge>
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Sistemas Mais Desejados" data={data.topSystems} emptyMsg="Nenhum dado de preferência de sistema." />
          <ChartCard title="Formatos Preferidos" data={data.topFormats} emptyMsg="Nenhum dado de formato." />
          <ChartCard title="Cidades com Maior Demanda" data={data.topCities} emptyMsg="Nenhum dado de cidade." />
          <ChartCard title="Faixa de Orçamento" data={data.budgetDistribution} emptyMsg="Nenhum dado de orçamento." />
        </div>
      </section>

      {/* BLOCK 3 — Supply Insights */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-secondary" /> Insights da Oferta
          <Badge variant="outline" className="text-[10px] ml-2">Mestres</Badge>
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Sistemas Dominados" data={data.gmSystems} emptyMsg="Nenhum dado de sistema de mestres." />
          <ChartCard title="Faixa de Preço Praticada" data={data.gmPriceRanges} emptyMsg="Nenhum dado de preço." />
          <ChartCard title="Cidades com Mais Mestres" data={data.gmCities} emptyMsg="Nenhum dado de cidade." />
          <ChartCard title="Formatos de Mesa Publicados" data={data.tableFormats} emptyMsg="Nenhum dado de formato." />
        </div>
      </section>

      {/* BLOCK 4 — Gap Analysis */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" /> Gap entre Oferta e Demanda
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.gaps.map((gap, i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 transition-all ${
                gap.severity === "high"
                  ? "border-destructive/30 bg-destructive/5"
                  : gap.severity === "medium"
                  ? "border-warning/30 bg-warning/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                {gap.severity === "high" ? (
                  <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : gap.severity === "medium" ? (
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{gap.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOCK 5 — Business Opportunities */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-secondary" /> Oportunidades de Negócio
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.opportunities.map((opp, i) => (
            <div key={i} className="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 shrink-0">
                  <Sparkles className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{opp.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opp.description}</p>
                  <Badge variant="outline" className="mt-2 text-[10px] border-secondary/30 text-secondary">{opp.action}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOCK 6 — Segments / Clusters */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" /> Segmentos Identificados
        </h2>
        <div className="space-y-6">
          {data.playerClusters.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" /> Clusters de Jogadores
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.playerClusters.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${c.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-display font-semibold">{c.name}</p>
                      <Badge variant="outline" className="text-[10px]">{c.count} perfis</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.gmClusters.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4" /> Clusters de Mestres
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.gmClusters.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${c.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-display font-semibold">{c.name}</p>
                      <Badge variant="outline" className="text-[10px]">{c.count} perfis</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.playerClusters.length === 0 && data.gmClusters.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <Layers className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Dados insuficientes para segmentação.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Mais perfis de anamnese são necessários para identificar clusters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, data, emptyMsg }: { title: string; data: { name: string; count: number }[]; emptyMsg: string }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-xs text-muted-foreground">{emptyMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 12%, 14%)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "hsl(260, 8%, 48%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(45, 15%, 92%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(260, 16%, 8%)",
              border: "1px solid hsl(260, 12%, 14%)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(45, 15%, 92%)",
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
