import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Crown, Store, Gamepad2, Layers, Target, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, Sparkles, BarChart3, DollarSign, MapPin,
  Calendar, CreditCard, Filter, ArrowRight, Zap, ShieldCheck, Brain
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ──────────────────────── types ──────────────────────── */

interface RawData {
  profiles: any[];
  players: any[];
  gms: any[];
  stores: any[];
  tables: any[];
  bookings: any[];
  subs: any[];
  onbSessions: any[];
}

interface Filters {
  city: string;
  role: string;
  format: string;
  priceRange: string;
  experience: string;
  modality: string;
}

const CHART_COLORS = [
  "hsl(270, 52%, 48%)", "hsl(42, 78%, 50%)", "hsl(152, 56%, 42%)",
  "hsl(210, 60%, 52%)", "hsl(320, 50%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(180, 50%, 45%)", "hsl(0, 68%, 48%)"
];

/* ──────────────────────── helpers ──────────────────────── */

function countJson(items: any[], key: string): Record<string, number> {
  const c: Record<string, number> = {};
  items.forEach((item) => {
    const val = item[key];
    if (Array.isArray(val)) {
      val.forEach((v: string) => { if (v) c[v] = (c[v] || 0) + 1; });
    } else if (typeof val === "string" && val) {
      c[val] = (c[val] || 0) + 1;
    }
  });
  return c;
}

function toRanked(counts: Record<string, number>, limit = 8) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
}

function budgetLabel(min: number | null, max: number | null): string {
  const avg = ((min || 0) + (max || 0)) / 2;
  if (avg <= 20) return "Até R$20";
  if (avg <= 40) return "R$20–40";
  if (avg <= 60) return "R$40–60";
  if (avg <= 100) return "R$60–100";
  return "R$100+";
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/* ──────────────────────── main page ──────────────────────── */

export default function AdminInsights() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    city: "all", role: "all", format: "all", priceRange: "all", experience: "all", modality: "all",
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [pRes, plRes, gmRes, stRes, tRes, bRes, sRes, oRes] = await Promise.all([
      supabase.from("profiles").select("user_id, role, city, created_at, onboarding_completed"),
      supabase.from("player_profiles").select("preferred_systems_json, preferred_styles_json, themes_like_json, themes_avoid_json, format_preference, budget_min, budget_max, experience_level, availability_json, user_id"),
      supabase.from("gm_profiles").select("systems_mastered_json, narrative_style_json, price_min, price_max, beginner_friendly, max_players_default, accepted_formats_json, availability_json, supports_corporate, supports_educational, supports_therapeutic, user_id"),
      supabase.from("store_profiles").select("*"),
      supabase.from("game_tables").select("system_name, city, play_format, session_type, seats_total, status, gm_user_id, created_at"),
      supabase.from("bookings").select("id, status, created_at"),
      supabase.from("subscriptions").select("id, status, current_period_end, plan_role"),
      supabase.from("onboarding_sessions").select("id, completed_at, user_id, role"),
    ]);
    setRaw({
      profiles: pRes.data || [],
      players: plRes.data || [],
      gms: gmRes.data || [],
      stores: stRes.data || [],
      tables: tRes.data || [],
      bookings: bRes.data || [],
      subs: sRes.data || [],
      onbSessions: oRes.data || [],
    });
    setLoading(false);
  }

  /* ──────────────────── computed insights ──────────────────── */
  const insights = useMemo(() => {
    if (!raw) return null;
    const { profiles, players, gms, stores, tables, bookings, subs, onbSessions } = raw;
    const now = new Date();

    // Apply city filter to profiles
    const fp = filters.city !== "all" ? profiles.filter(p => p.city === filters.city) : profiles;
    const playerUserIds = new Set(fp.filter(p => p.role === "player").map(p => p.user_id));
    const gmUserIds = new Set(fp.filter(p => p.role === "gm").map(p => p.user_id));

    let filteredPlayers = filters.city !== "all" ? players.filter(p => playerUserIds.has(p.user_id)) : players;
    let filteredGms = filters.city !== "all" ? gms.filter(g => gmUserIds.has(g.user_id)) : gms;

    if (filters.experience !== "all") filteredPlayers = filteredPlayers.filter(p => p.experience_level === filters.experience);
    if (filters.format !== "all") filteredPlayers = filteredPlayers.filter(p => p.format_preference === filters.format);

    // KPIs
    const totalPlayers = profiles.filter(p => p.role === "player").length;
    const totalGMs = profiles.filter(p => p.role === "gm").length;
    const totalStores = profiles.filter(p => p.role === "store").length;
    const completedOnb = onbSessions.filter(o => o.completed_at).length;
    const onbRate = pct(completedOnb, onbSessions.length);
    const activeSubs = subs.filter(s => s.status === "active" && new Date(s.current_period_end) > now).length;

    // Cities
    const playerCities: Record<string, number> = {};
    fp.filter(p => p.role === "player" && p.city).forEach(p => { playerCities[p.city!] = (playerCities[p.city!] || 0) + 1; });
    const gmCities: Record<string, number> = {};
    fp.filter(p => p.role === "gm" && p.city).forEach(p => { gmCities[p.city!] = (gmCities[p.city!] || 0) + 1; });
    const storeCities: Record<string, number> = {};
    fp.filter(p => p.role === "store" && p.city).forEach(p => { storeCities[p.city!] = (storeCities[p.city!] || 0) + 1; });

    // DEMAND
    const demandSystems = countJson(filteredPlayers, "preferred_systems_json");
    const demandStyles = countJson(filteredPlayers, "preferred_styles_json");
    const demandThemesLike = countJson(filteredPlayers, "themes_like_json");
    const demandThemesAvoid = countJson(filteredPlayers, "themes_avoid_json");
    const demandFormats = countJson(filteredPlayers, "format_preference");
    const expLevels = countJson(filteredPlayers, "experience_level");
    const budgetDist: Record<string, number> = {};
    filteredPlayers.forEach(p => { const r = budgetLabel(p.budget_min, p.budget_max); budgetDist[r] = (budgetDist[r] || 0) + 1; });

    // SUPPLY
    const supplySystems = countJson(filteredGms, "systems_mastered_json");
    const supplyStyles = countJson(filteredGms, "narrative_style_json");
    const supplyFormats = countJson(filteredGms, "accepted_formats_json");
    const gmPriceDist: Record<string, number> = {};
    filteredGms.forEach(g => { const r = budgetLabel(g.price_min, g.price_max); gmPriceDist[r] = (gmPriceDist[r] || 0) + 1; });

    // Top values for executive summary
    const topSystem = toRanked(demandSystems, 1)[0]?.name || "—";
    const topFormat = toRanked(demandFormats, 1)[0]?.name || "—";
    const topCity = toRanked(playerCities, 1)[0]?.name || "—";
    const topBudget = toRanked(budgetDist, 1)[0]?.name || "—";

    // GAP analysis
    const gaps: { title: string; description: string; severity: "high" | "medium" | "low"; type: string }[] = [];
    const topDemandSys = Object.entries(demandSystems).sort((a, b) => b[1] - a[1]).slice(0, 8);
    topDemandSys.forEach(([sys, dc]) => {
      const sc = supplySystems[sys] || 0;
      if (dc > sc * 2 && dc >= 2) {
        gaps.push({
          title: `Alta demanda por ${sys}`,
          description: `${dc} jogadores procuram, mas apenas ${sc} mestre(s) dominam esse sistema. Oportunidade de recrutamento ou incentivo.`,
          severity: sc === 0 ? "high" : "medium",
          type: "system",
        });
      }
    });

    const topDemandCities = Object.entries(playerCities).sort((a, b) => b[1] - a[1]).slice(0, 8);
    topDemandCities.forEach(([city, dc]) => {
      const sc = gmCities[city] || 0;
      if (dc > sc * 3 && dc >= 2) {
        gaps.push({
          title: `Demanda reprimida em ${city}`,
          description: `${dc} jogadores na região, mas apenas ${sc} mestre(s) disponíveis. Região com alto potencial de crescimento.`,
          severity: sc === 0 ? "high" : "medium",
          type: "city",
        });
      }
    });

    const beginnerFriendlyGMs = filteredGms.filter(g => g.beginner_friendly).length;
    const beginnerPlayers = filteredPlayers.filter(p => ["iniciante", "beginner"].includes(p.experience_level)).length;
    if (beginnerPlayers > beginnerFriendlyGMs * 2 && beginnerPlayers >= 2) {
      gaps.push({
        title: "Jogadores iniciantes sem suporte suficiente",
        description: `${beginnerPlayers} iniciantes buscam mesas, mas apenas ${beginnerFriendlyGMs} mestres se posicionam como beginner-friendly. Potencial de conversão alto.`,
        severity: "medium",
        type: "experience",
      });
    }

    // Budget gap
    const budgetDesired = toRanked(budgetDist, 1)[0];
    const budgetOffered = toRanked(gmPriceDist, 1)[0];
    if (budgetDesired && budgetOffered && budgetDesired.name !== budgetOffered.name) {
      gaps.push({
        title: "Desalinhamento de faixa de preço",
        description: `A faixa mais desejada pelos jogadores é "${budgetDesired.name}", mas a maioria dos mestres pratica "${budgetOffered.name}". Ajuste de pricing pode aumentar conversão.`,
        severity: "medium",
        type: "pricing",
      });
    }

    // Presencial demand vs store supply
    const presencialDemand = filteredPlayers.filter(p => p.format_preference === "presencial").length;
    if (presencialDemand > 0 && stores.length < Math.ceil(presencialDemand / 10)) {
      gaps.push({
        title: "Demanda presencial supera oferta de lojas",
        description: `${presencialDemand} jogadores preferem presencial, mas apenas ${stores.length} loja(s) cadastrada(s). Há oportunidade para ativar parceiros.`,
        severity: presencialDemand > 5 ? "high" : "medium",
        type: "store",
      });
    }

    if (gaps.length === 0) {
      gaps.push({
        title: "Dados insuficientes para análise de gaps",
        description: "Mais cadastros são necessários para identificar desbalanços significativos entre oferta e demanda.",
        severity: "low",
        type: "info",
      });
    }

    // OPPORTUNITIES
    const opportunities: { title: string; description: string; action: string; timeframe: string }[] = [];
    if (topDemandSys.length > 0) {
      opportunities.push({
        title: `Recrutar mestres de ${topDemandSys[0][0]}`,
        description: `Sistema com maior demanda. Campanhas de aquisição focadas nesse nicho tendem a gerar liquidez rápida.`,
        action: "Campanha de aquisição",
        timeframe: "Imediata",
      });
    }
    if (topDemandCities.length > 0) {
      const [city, count] = topDemandCities[0];
      const gmCount = gmCities[city] || 0;
      if (gmCount < count) {
        opportunities.push({
          title: `Expandir presença em ${city}`,
          description: `${count} jogadores interessados, ${gmCount} mestres ativos. Potencial de crescimento significativo.`,
          action: "Expansão regional",
          timeframe: "Curto prazo",
        });
      }
    }
    if (totalGMs > 0 && activeSubs < totalGMs * 0.3) {
      opportunities.push({
        title: "Converter mestres free para Pro",
        description: `Apenas ${activeSubs} assinaturas ativas entre ${totalGMs} mestres. Trial ou oferta founder pode destravar receita recorrente.`,
        action: "Upsell de plano",
        timeframe: "Imediata",
      });
    }
    if (beginnerPlayers > 3) {
      opportunities.push({
        title: "Incentivar mesas introdutórias",
        description: `${beginnerPlayers} jogadores iniciantes representam cluster ativo. Criar programa de "primeira mesa" pode aumentar retenção inicial.`,
        action: "Programa de onboarding",
        timeframe: "Médio prazo",
      });
    }
    opportunities.push({
      title: "Impulsionar perfis com potencial via boost",
      description: "Mestres com mesas ativas são candidatos ideais para créditos de teste de destaque. Pode aumentar ARPU significativamente.",
      action: "Engajamento via boost",
      timeframe: "Operacional",
    });

    // CLUSTERS — Players
    const playerClusters: { name: string; description: string; count: number; monetization: string; color: string }[] = [];
    const pc = filteredPlayers;
    const beginners = pc.filter(p => ["iniciante", "beginner"].includes(p.experience_level));
    const budget30 = pc.filter(p => (p.budget_max || 0) <= 30);
    const premium = pc.filter(p => (p.budget_max || 0) >= 80);
    const campaignFirst = pc.filter(p => ["campanha", "campaign"].includes(p.format_preference));
    const oneShotCasual = pc.filter(p => ["one-shot", "one_shot"].includes(p.format_preference));
    const presencial = pc.filter(p => p.format_preference === "presencial");

    if (beginners.length > 0) playerClusters.push({ name: "Iniciante Econômico", description: "Novatos buscando primeira experiência com orçamento limitado", count: beginners.length, monetization: "Conversão via trial e primeira mesa gratuita", color: "border-info/20 bg-info/5" });
    if (premium.length > 0) playerClusters.push({ name: "Narrativo Premium", description: "Alto ticket, buscam experiências imersivas diferenciadas", count: premium.length, monetization: "Assinatura Guilda + mesas premium", color: "border-secondary/20 bg-secondary/5" });
    if (campaignFirst.length > 0) playerClusters.push({ name: "Campaign-First", description: "Preferem arco narrativo contínuo e compromisso de longo prazo", count: campaignFirst.length, monetization: "Alta retenção, potencial de recorrência", color: "border-primary/20 bg-primary/5" });
    if (oneShotCasual.length > 0) playerClusters.push({ name: "One-Shot Casual", description: "Sessões independentes sem compromisso", count: oneShotCasual.length, monetization: "Volume de reservas, cross-sell de campanha", color: "border-accent/20 bg-accent/5" });
    if (presencial.length > 0) playerClusters.push({ name: "Presencial Local", description: "Foco em experiência presencial na sua cidade", count: presencial.length, monetization: "Parceria com lojas locais, boost regional", color: "border-success/20 bg-success/5" });

    // CLUSTERS — GMs
    const gmClusters: { name: string; description: string; count: number; monetization: string; color: string }[] = [];
    const friendlyGMs = filteredGms.filter(g => g.beginner_friendly);
    const highTicketGMs = filteredGms.filter(g => (g.price_max || 0) >= 80);
    const volumeGMs = filteredGms.filter(g => (g.max_players_default || 0) >= 6);
    const corpGMs = filteredGms.filter(g => g.supports_corporate || g.supports_educational || g.supports_therapeutic);

    if (friendlyGMs.length > 0) gmClusters.push({ name: "Beginner-Friendly", description: "Mestres acolhedores para iniciantes", count: friendlyGMs.length, monetization: "Potencial de volume alto, candidatos a Pro", color: "border-success/20 bg-success/5" });
    if (highTicketGMs.length > 0) gmClusters.push({ name: "Premium Narrativo", description: "Alto ticket, experiências imersivas diferenciadas", count: highTicketGMs.length, monetization: "Candidatos a Pro+, alto ARPU", color: "border-secondary/20 bg-secondary/5" });
    if (volumeGMs.length > 0) gmClusters.push({ name: "Operador de Volume", description: "Mesas grandes, foco em escala e recorrência", count: volumeGMs.length, monetization: "Candidatos a Pro, receita via take rate", color: "border-primary/20 bg-primary/5" });
    if (corpGMs.length > 0) gmClusters.push({ name: "Corporativo/Educacional", description: "Suporte a sessões terapêuticas, corporativas ou educacionais", count: corpGMs.length, monetization: "Nicho premium, pricing diferenciado", color: "border-warning/20 bg-warning/5" });

    // CLUSTERS — Stores
    const storeClusters: { name: string; description: string; count: number; monetization: string; color: string }[] = [];
    if (stores.length > 0) {
      const smallStores = stores.filter((s: any) => (s.max_concurrent_tables || 0) <= 3);
      const largeStores = stores.filter((s: any) => (s.max_concurrent_tables || 0) > 3);
      if (smallStores.length > 0) storeClusters.push({ name: "Loja Boutique", description: "Espaço menor, foco em comunidade local", count: smallStores.length, monetization: "Plano Base, ativação de comunidade", color: "border-info/20 bg-info/5" });
      if (largeStores.length > 0) storeClusters.push({ name: "Operação Intensiva", description: "Alta capacidade e agenda recorrente", count: largeStores.length, monetization: "Plano Growth, agenda automatizada", color: "border-primary/20 bg-primary/5" });
      if (storeClusters.length === 0) storeClusters.push({ name: "Ponto Local", description: "Lojas em fase de ativação", count: stores.length, monetization: "Plano Base com trial de 14 dias", color: "border-accent/20 bg-accent/5" });
    }

    // MONETIZATION insights
    const monetization = {
      bestBudget: topBudget,
      proUpgradePotential: totalGMs > 0 ? pct(totalGMs - activeSubs, totalGMs) : 0,
      topCityForSubs: topCity,
      gmProCandidates: filteredGms.filter(g => (g.price_max || 0) >= 40).length,
      storeGrowthCandidates: stores.filter((s: any) => (s.max_concurrent_tables || 0) > 3).length,
      boostOpportunity: tables.filter((t: any) => t.status === "published").length,
    };

    // Available filter options
    const allCities = [...new Set(profiles.map(p => p.city).filter(Boolean))].sort();

    return {
      totalPlayers, totalGMs, totalStores,
      totalAnamneses: completedOnb,
      totalOnbSessions: onbSessions.length,
      onbRate,
      activeSubs,
      totalTables: tables.length,
      totalBookings: bookings.length,
      topSystem, topFormat, topCity, topBudget,
      // Demand
      demandSystems: toRanked(demandSystems),
      demandStyles: toRanked(demandStyles),
      demandThemesLike: toRanked(demandThemesLike),
      demandThemesAvoid: toRanked(demandThemesAvoid),
      demandFormats: toRanked(demandFormats),
      budgetDist: toRanked(budgetDist),
      expLevels: toRanked(expLevels),
      playerCitiesRanked: toRanked(playerCities),
      // Supply
      supplySystems: toRanked(supplySystems),
      supplyStyles: toRanked(supplyStyles),
      supplyFormats: toRanked(supplyFormats),
      gmPriceRanges: toRanked(gmPriceDist),
      gmCitiesRanked: toRanked(gmCities),
      storeCitiesRanked: toRanked(storeCities),
      // Analysis
      gaps, opportunities,
      playerClusters, gmClusters, storeClusters,
      monetization,
      allCities,
      // Main gap for summary
      mainGap: gaps.find(g => g.severity === "high")?.title || gaps[0]?.title || "—",
    };
  }, [raw, filters]);

  /* ──────────────────── filter UI ──────────────────── */
  function FilterBar() {
    if (!insights) return null;
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium">Filtros</span>
        </div>
        <Select value={filters.city} onValueChange={v => setFilters(f => ({ ...f, city: v }))}>
          <SelectTrigger className="h-8 w-[150px] text-xs bg-card border-border"><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {insights.allCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.experience} onValueChange={v => setFilters(f => ({ ...f, experience: v }))}>
          <SelectTrigger className="h-8 w-[140px] text-xs bg-card border-border"><SelectValue placeholder="Experiência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.format} onValueChange={v => setFilters(f => ({ ...f, format: v }))}>
          <SelectTrigger className="h-8 w-[130px] text-xs bg-card border-border"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os formatos</SelectItem>
            <SelectItem value="one-shot">One-Shot</SelectItem>
            <SelectItem value="campanha">Campanha</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  /* ──────────────────── render ──────────────────── */
  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
          <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        </div>
      </AdminLayout>
    );
  }

  if (!insights) return <AdminLayout><p className="text-muted-foreground">Erro ao carregar dados.</p></AdminLayout>;
  const d = insights;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Inteligência de Mercado
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Insights estratégicos gerados a partir das anamneses e registros iniciais dos usuários.
          </p>
        </div>

        <FilterBar />

        {/* ═══ BLOCO 1 — RESUMO EXECUTIVO ═══ */}
        <section>
          <SectionTitle icon={<BarChart3 className="h-5 w-5 text-primary" />} title="Resumo Executivo" />
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Anamneses Concluídas" value={d.totalAnamneses} icon={<ShieldCheck className="h-4 w-4 text-success" />} sub={`${d.onbRate}% taxa de conclusão`} />
            <StatCard label="Jogadores Analisados" value={d.totalPlayers} icon={<Gamepad2 className="h-4 w-4 text-info" />} />
            <StatCard label="Mestres Analisados" value={d.totalGMs} icon={<Crown className="h-4 w-4 text-secondary" />} />
            <StatCard label="Lojas Analisadas" value={d.totalStores} icon={<Store className="h-4 w-4 text-accent" />} />
            <StatCard label="Assinaturas Ativas" value={d.activeSubs} icon={<CreditCard className="h-4 w-4 text-primary" />} />
          </div>
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-5">
            <SummaryChip label="Sistema Top" value={d.topSystem} />
            <SummaryChip label="Formato Top" value={d.topFormat} />
            <SummaryChip label="Cidade Top" value={d.topCity} />
            <SummaryChip label="Orçamento Dominante" value={d.topBudget} />
            <SummaryChip label="Principal Gap" value={d.mainGap} highlight />
          </div>
        </section>

        {/* ═══ BLOCO 2 — DEMANDA DOS JOGADORES ═══ */}
        <section>
          <SectionTitle icon={<TrendingUp className="h-5 w-5 text-info" />} title="Demanda dos Jogadores" badge="Análise de Anamnese" />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Sistemas Mais Desejados" data={d.demandSystems} />
            <ChartCard title="Estilos Mais Desejados" data={d.demandStyles} />
            <ChartCard title="Temas Preferidos" data={d.demandThemesLike} />
            <ChartCard title="Formatos Preferidos" data={d.demandFormats} />
            <ChartCard title="Faixa de Orçamento" data={d.budgetDist} />
            <ChartCard title="Nível de Experiência" data={d.expLevels} />
            <ChartCard title="Cidades com Maior Demanda" data={d.playerCitiesRanked} />
            {d.demandThemesAvoid.length > 0 && <ChartCard title="Temas Evitados" data={d.demandThemesAvoid} />}
          </div>
        </section>

        {/* ═══ BLOCO 3 — OFERTA DOS MESTRES ═══ */}
        <section>
          <SectionTitle icon={<Crown className="h-5 w-5 text-secondary" />} title="Oferta dos Mestres" badge="Perfis Cadastrados" />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Sistemas Dominados" data={d.supplySystems} />
            <ChartCard title="Estilos Narrativos" data={d.supplyStyles} />
            <ChartCard title="Formatos Aceitos" data={d.supplyFormats} />
            <ChartCard title="Faixa de Preço Praticada" data={d.gmPriceRanges} />
            <ChartCard title="Cidades com Mestres" data={d.gmCitiesRanked} />
          </div>
        </section>

        {/* ═══ BLOCO 4 — OFERTA DAS LOJAS ═══ */}
        <section>
          <SectionTitle icon={<Store className="h-5 w-5 text-accent" />} title="Oferta das Lojas" badge="Luderias Cadastradas" />
          {d.storeCitiesRanked.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Cidades com Lojas" data={d.storeCitiesRanked} />
            </div>
          ) : (
            <EmptyBlock message="Nenhuma loja cadastrada ainda. Dados de operação estarão disponíveis após os primeiros cadastros." />
          )}
        </section>

        {/* ═══ BLOCO 5 — GAP ENTRE OFERTA E DEMANDA ═══ */}
        <section>
          <SectionTitle icon={<AlertTriangle className="h-5 w-5 text-warning" />} title="Gap entre Oferta e Demanda" />
          <div className="grid gap-3 md:grid-cols-2">
            {d.gaps.map((gap, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 transition-all hover:shadow-lg ${
                  gap.severity === "high"
                    ? "border-destructive/30 bg-destructive/5 hover:shadow-destructive/5"
                    : gap.severity === "medium"
                    ? "border-warning/30 bg-warning/5 hover:shadow-warning/5"
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
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {gap.severity === "high" ? "⚡ Crítico" : gap.severity === "medium" ? "⚠️ Atenção" : "ℹ️ Info"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ BLOCO 6 — OPORTUNIDADES DE NEGÓCIO ═══ */}
        <section>
          <SectionTitle icon={<Lightbulb className="h-5 w-5 text-secondary" />} title="Oportunidades de Negócio" />
          <div className="grid gap-3 md:grid-cols-2">
            {d.opportunities.map((opp, i) => (
              <div key={i} className="rounded-xl border border-secondary/20 bg-secondary/5 p-5 transition-all hover:shadow-lg hover:shadow-secondary/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 shrink-0">
                    <Sparkles className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">{opp.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opp.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary">{opp.action}</Badge>
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{opp.timeframe}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ BLOCO 7 — SEGMENTOS / CLUSTERS ═══ */}
        <section>
          <SectionTitle icon={<Layers className="h-5 w-5 text-primary" />} title="Segmentação de Mercado" />
          <div className="space-y-6">
            {d.playerClusters.length > 0 && (
              <ClusterGroup title="Clusters de Jogadores" icon={<Gamepad2 className="h-4 w-4" />} clusters={d.playerClusters} onAction={(name) => navigate(`/admin/usuarios?cluster=${encodeURIComponent(name)}`)} />
            )}
            {d.gmClusters.length > 0 && (
              <ClusterGroup title="Clusters de Mestres" icon={<Crown className="h-4 w-4" />} clusters={d.gmClusters} onAction={(name) => navigate(`/admin/usuarios?cluster=${encodeURIComponent(name)}`)} />
            )}
            {d.storeClusters.length > 0 && (
              <ClusterGroup title="Clusters de Lojas" icon={<Store className="h-4 w-4" />} clusters={d.storeClusters} onAction={(name) => navigate(`/admin/usuarios?cluster=${encodeURIComponent(name)}`)} />
            )}
            {d.playerClusters.length === 0 && d.gmClusters.length === 0 && d.storeClusters.length === 0 && (
              <EmptyBlock message="Dados insuficientes para segmentação. Mais perfis de anamnese são necessários para identificar clusters." />
            )}
          </div>
        </section>

        {/* ═══ BLOCO 8 — LEITURA DE MONETIZAÇÃO ═══ */}
        <section>
          <SectionTitle icon={<DollarSign className="h-5 w-5 text-success" />} title="Leitura de Monetização" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <MonetizationCard
              title="Faixa de Preço com Maior Aderência"
              value={d.monetization.bestBudget}
              description="Concentra a maior intenção de compra entre jogadores analisados."
              icon={<Target className="h-4 w-4 text-success" />}
            />
            <MonetizationCard
              title="Potencial de Upgrade para Pro"
              value={`${d.monetization.proUpgradePotential}%`}
              description={`${d.monetization.gmProCandidates} mestres com ticket acima de R$40 são candidatos naturais ao plano Pro.`}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
            />
            <MonetizationCard
              title="Cidade com Maior Potencial"
              value={d.monetization.topCityForSubs}
              description="Região com maior concentração de demanda e potencial de assinatura."
              icon={<MapPin className="h-4 w-4 text-info" />}
            />
            <MonetizationCard
              title="Candidatos a Loja Growth"
              value={String(d.monetization.storeGrowthCandidates)}
              description="Lojas com alta capacidade que justificam plano Growth."
              icon={<Store className="h-4 w-4 text-accent" />}
            />
            <MonetizationCard
              title="Mesas Aptas para Boost"
              value={String(d.monetization.boostOpportunity)}
              description="Mesas publicadas que podem ser impulsionadas para maior visibilidade."
              icon={<Zap className="h-4 w-4 text-secondary" />}
            />
            <MonetizationCard
              title="Elasticidade de Pricing"
              value={d.budgetDist.length >= 2 ? `${d.budgetDist[0]?.name} → ${d.budgetDist[1]?.name}` : "—"}
              description="As duas faixas mais frequentes indicam espaço para testar pricing entre elas."
              icon={<DollarSign className="h-4 w-4 text-warning" />}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

/* ──────────────────────── sub-components ──────────────────────── */

function SectionTitle({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
      {icon} {title}
      {badge && <Badge variant="outline" className="text-[10px] ml-2">{badge}</Badge>}
    </h2>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mb-2">{icon}</div>
      <div className="text-xl font-display font-bold text-foreground">{value}</div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-success mt-0.5">{sub}</p>}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function SummaryChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-warning/30 bg-warning/5" : "border-border bg-card"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-display font-semibold mt-0.5 ${highlight ? "text-warning" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-xs text-muted-foreground">Dados insuficientes.</p>
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
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: "hsl(45, 15%, 92%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(260, 16%, 8%)", border: "1px solid hsl(260, 12%, 14%)", borderRadius: "8px", fontSize: "12px", color: "hsl(45, 15%, 92%)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClusterGroup({ title, icon, clusters, onAction }: { title: string; icon: React.ReactNode; clusters: { name: string; description: string; count: number; monetization: string; color: string }[]; onAction: (name: string) => void }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">{icon} {title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map((c, i) => (
          <div key={i} className={`rounded-xl border p-4 transition-all hover:shadow-lg ${c.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-display font-semibold text-foreground">{c.name}</p>
              <Badge variant="outline" className="text-[10px]">{c.count} perfis</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
            <p className="text-xs text-primary/80 mt-2 leading-relaxed">💰 {c.monetization}</p>
            <button
              onClick={() => onAction(c.name)}
              className="flex items-center gap-1 mt-3 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver usuários deste cluster <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonetizationCard({ title, value, description, icon }: { title: string; value: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-success/15 bg-success/5 p-5 transition-all hover:shadow-lg hover:shadow-success/5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 shrink-0">{icon}</div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-lg font-display font-bold text-foreground mt-0.5">{value}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <Layers className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
