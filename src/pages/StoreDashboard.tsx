import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import type { Tables } from "@/integrations/supabase/types";
import {
  Store, Calendar, BarChart3, TrendingUp, Settings, Plus, Users,
  MapPin, Clock, DollarSign, Eye, Megaphone, Crown, Edit2, Trash2,
  Building2, Armchair, LayoutGrid, CalendarDays, PieChart, Zap,
  CheckCircle2, AlertCircle, ArrowRight, Globe, Phone, FileText,
  UserCheck, BookOpen, Star
} from "lucide-react";

type Mesa = Tables<"mesas">;
type StoreData = Tables<"stores">;

type Tab = "overview" | "space" | "agenda" | "feed";

const navItems = [
  { label: "Início", path: "/dashboard/loja", icon: <Store className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Destaque", path: "/boost", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Assinatura", path: "/billing", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <FileText className="h-4 w-4" /> },
];

const DEFAULT_LIMITS = { mesasPerMonth: 4, feedHighlight: false };


function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-lg ${accent ? "border-secondary/30 bg-secondary/5 hover:shadow-secondary/10" : "border-border bg-card hover:shadow-primary/5 hover:border-primary/20"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-display font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${accent ? "from-secondary/40 to-accent/40" : "from-primary/40 to-secondary/40"}`} />
    </div>
  );
}

function EmptyBlock({ icon, text, sub, action, onAction }: { icon: React.ReactNode; text: string; sub: string; action?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto text-muted-foreground/50 mb-3">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
      {action && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

export default function StoreDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const sub = useSubscription();
  const displayName = user?.user_metadata?.name || "Luderia";
  const [tab, setTab] = useState<Tab>("overview");

  const [store, setStore] = useState<StoreData | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  // Store form state
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeWebsite, setStoreWebsite] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeCapacity, setStoreCapacity] = useState(20);
  const [storeSimTables, setStoreSimTables] = useState(4);
  const [storeOpenDays, setStoreOpenDays] = useState<string[]>([]);

  // Real plan data from subscription
  const flags = sub.featureFlags || {};
  const planMesasPerMonth = (flags.mesas_per_month as number) || DEFAULT_LIMITS.mesasPerMonth;
  const planLabel = sub.plan?.name || "Sem plano";
  const planPrice = sub.plan ? `R$${(sub.plan.price_monthly / 100).toFixed(2).replace(".", ",")}/mês` : "";
  const isGrowth = sub.plan?.code === "store_growth";
  const hasFeedHighlight = !!flags.feed_highlight;

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    const [storeRes, mesasRes] = await Promise.all([
      supabase.from("stores").select("*").eq("owner_id", user.id).maybeSingle(),
      supabase.from("mesas").select("*").eq("store_id", user.id).order("start_at", { ascending: false }),
    ]);

    if (storeRes.data) {
      setStore(storeRes.data);
      setStoreName(storeRes.data.name || "");
      setStoreAddress(storeRes.data.address || "");
      setStoreCity(storeRes.data.city || "");
      setStorePhone(storeRes.data.phone || "");
      setStoreWebsite(storeRes.data.website || "");
      setStoreDescription(storeRes.data.description || "");
      setStoreCapacity(storeRes.data.capacity || 20);
      setStoreSimTables(storeRes.data.simultaneous_tables || 4);
      setStoreOpenDays(storeRes.data.opening_days || []);
    }

    // Also try fetching mesas linked via store_id matching the store's id
    if (storeRes.data) {
      const { data: storeMesas } = await supabase.from("mesas").select("*").eq("store_id", storeRes.data.id).order("start_at", { ascending: false });
      setMesas(storeMesas || []);
    } else {
      setMesas([]);
    }

    setLoading(false);
  }

  async function handleSaveStore() {
    if (!user || !storeName.trim()) return;
    setSavingStore(true);

    const payload = {
      name: storeName,
      address: storeAddress,
      city: storeCity,
      phone: storePhone,
      website: storeWebsite,
      description: storeDescription,
      capacity: storeCapacity,
      simultaneous_tables: storeSimTables,
      opening_days: storeOpenDays,
      owner_id: user.id,
    };

    if (store) {
      const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
      if (!error) toast({ title: "Luderia atualizada!" });
      else toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      const { error } = await supabase.from("stores").insert(payload);
      if (!error) toast({ title: "Luderia cadastrada!" });
      else toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    }
    setSavingStore(false);
    fetchData();
  }

  // Derived stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const mesasThisMonth = mesas.filter((m) => {
    const d = new Date(m.start_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const upcomingMesas = mesas.filter((m) => new Date(m.start_at) >= now && m.status === "aberta");
  const totalSeats = mesas.reduce((s, m) => s + m.seats_total, 0);
  const filledSeats = mesas.reduce((s, m) => s + (m.seats_total - m.seats_available), 0);
  const occupancyRate = totalSeats > 0 ? Math.round((filledSeats / totalSeats) * 100) : 0;
  const uniqueSystems = new Set(mesas.map((m) => m.system));
  const mesasUsedOfPlan = mesasThisMonth.length;
  const mesasRemaining = Math.max(0, planMesasPerMonth - mesasUsedOfPlan);

  const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Visão Geral", icon: <PieChart className="h-4 w-4" /> },
    { key: "agenda", label: "Agenda", icon: <CalendarDays className="h-4 w-4" /> },
    { key: "space", label: "Meu Espaço", icon: <Building2 className="h-4 w-4" /> },
    { key: "feed", label: "Feed", icon: <Megaphone className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="store" navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Painel da Luderia <Store className="h-5 w-5 text-secondary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Organize mesas, eventos e acompanhe sua operação.</p>
          </div>
          {/* Plan badge */}
          <div className={`self-start flex items-center gap-2 rounded-xl border px-4 py-2.5 ${isGrowth ? "border-secondary/30 bg-secondary/5" : "border-border bg-card"}`}>
            {isGrowth ? <Star className="h-4 w-4 text-secondary" /> : <Store className="h-4 w-4 text-muted-foreground" />}
            <div>
              <span className={`text-sm font-display font-bold ${isGrowth ? "text-secondary" : "text-foreground"}`}>{planLabel}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{planPrice}</span>
            </div>
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

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Subscription banner for non-subscribers */}
            {!sub.loading && !sub.isActive && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 flex items-center gap-3">
                <Store className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground flex-1">
                  Ative seu plano para desbloquear agenda completa, analytics e destaque.
                </p>
                <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/billing")}>
                  Ver planos <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Plan usage bar */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">Uso do plano — {new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mesasUsedOfPlan} de {planMesasPerMonth} mesas utilizadas</p>
                </div>
                {mesasRemaining <= 1 && mesasUsedOfPlan > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {mesasRemaining === 0 ? "Limite atingido" : "Quase no limite"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${mesasUsedOfPlan >= planMesasPerMonth ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, (mesasUsedOfPlan / planMesasPerMonth) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{Math.round((mesasUsedOfPlan / planMesasPerMonth) * 100)}%</span>
              </div>
              {!isGrowth && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-secondary/5 border border-secondary/20 p-3">
                  <Zap className="h-4 w-4 text-secondary shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">Faça upgrade para <span className="font-semibold text-secondary">Luderia Growth</span> e tenha até 12 mesas/mês + destaque no feed.</p>
                  <Button variant="outline" size="sm" className="shrink-0 text-xs border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/billing")}>
                    Upgrade
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Mesas no mês" value={String(mesasThisMonth.length)} sub={`de ${planMesasPerMonth} disponíveis`} />
              <StatCard icon={<Calendar className="h-5 w-5" />} label="Próximas" value={String(upcomingMesas.length)} />
              <StatCard icon={<PieChart className="h-5 w-5" />} label="Ocupação" value={`${occupancyRate}%`} />
              <StatCard icon={<BookOpen className="h-5 w-5" />} label="Sistemas" value={String(uniqueSystems.size)} />
              <StatCard icon={<Eye className="h-5 w-5" />} label="Visualizações" value="—" />
              <StatCard icon={<Megaphone className="h-5 w-5" />} label="Posts no feed" value="0" />
            </div>

            {/* Store info summary */}
            {store ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-display font-semibold text-foreground">{store.name}</h3>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setTab("space")}>
                    <Edit2 className="h-3 w-3" /> Editar
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {store.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{store.address}{store.city ? `, ${store.city}` : ""}</span>
                    </div>
                  )}
                  {store.capacity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>Capacidade: {store.capacity} pessoas</span>
                    </div>
                  )}
                  {store.simultaneous_tables && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LayoutGrid className="h-4 w-4 shrink-0" />
                      <span>{store.simultaneous_tables} mesas simultâneas</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-accent mb-2" />
                <p className="text-sm font-medium text-foreground">Cadastre seu espaço</p>
                <p className="text-xs text-muted-foreground mt-1">Preencha as informações da sua luderia para aparecer no mapa e receber mesas.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setTab("space")}>
                  Cadastrar agora
                </Button>
              </div>
            )}

            {/* Recent mesas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-display font-semibold text-foreground">Mesas Recentes</h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setTab("agenda")}>
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              {mesas.length === 0 ? (
                <EmptyBlock
                  icon={<Calendar className="h-10 w-10" />}
                  text="Nenhuma mesa associada."
                  sub="Mestres podem associar mesas à sua luderia."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mesas.slice(0, 6).map((m) => (
                    <AgendaMesaCard key={m.id} mesa={m} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── AGENDA ─── */}
        {tab === "agenda" && (
          <div className="space-y-5">
            {/* Gate agenda behind active plan */}
            {!sub.loading && !sub.isActive && (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-display font-bold text-foreground mb-2">Agenda operacional</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                  A gestão completa de agenda está disponível para luderias com plano ativo. Ative seu plano para organizar mesas e eventos.
                </p>
                <Button variant="gradient" size="sm" className="gap-2" onClick={() => navigate("/billing")}>
                  <Sparkles className="h-4 w-4" /> Ver planos
                </Button>
              </div>
            )}
            {sub.isActive && (<>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-foreground">Agenda de Mesas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mesas agendadas na sua luderia.</p>
              </div>
              {mesasRemaining > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {mesasRemaining} vagas restantes no plano
                </Badge>
              )}
            </div>

            {/* Upcoming */}
            {upcomingMesas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Próximas
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingMesas.map((m) => (
                    <AgendaMesaCard key={m.id} mesa={m} upcoming />
                  ))}
                </div>
              </div>
            )}

            {/* All mesas */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Todas as mesas</h3>
              {mesas.length === 0 ? (
                <EmptyBlock
                  icon={<Calendar className="h-10 w-10" />}
                  text="Nenhuma mesa agendada."
                  sub="Quando mestres associarem mesas à sua loja, elas aparecerão aqui."
                />
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mesa</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Mestre</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Sistema</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Data</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Vagas</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mesas.map((m) => {
                        const filled = m.seats_total - m.seats_available;
                        return (
                          <tr key={m.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/mesa/${m.id}`)}>
                            <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{m.gm_name}</td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <Badge variant="secondary" className="text-[10px]">{m.system}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                              {new Date(m.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-medium">{filled}/{m.seats_total}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={m.status === "aberta" ? "default" : "secondary"} className="text-[10px]">{m.status}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>)}
          </div>
        )}

        {/* ─── SPACE MANAGEMENT ─── */}
        {tab === "space" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">Meu Espaço</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Cadastre ou edite as informações da sua luderia.</p>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 space-y-5">
                {/* Basic info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Nome da luderia" value={storeName} onChange={setStoreName} placeholder="Ex: Dungeon Club" icon={<Store className="h-4 w-4" />} />
                  <FormInput label="Cidade" value={storeCity} onChange={setStoreCity} placeholder="Ex: São Paulo, SP" icon={<MapPin className="h-4 w-4" />} />
                </div>

                <FormInput label="Endereço completo" value={storeAddress} onChange={setStoreAddress} placeholder="Rua, número, bairro" icon={<MapPin className="h-4 w-4" />} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Telefone" value={storePhone} onChange={setStorePhone} placeholder="(11) 99999-9999" icon={<Phone className="h-4 w-4" />} />
                  <FormInput label="Website / Instagram" value={storeWebsite} onChange={setStoreWebsite} placeholder="https://..." icon={<Globe className="h-4 w-4" />} />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
                  <textarea
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Conte sobre o ambiente, diferenciais, o que a luderia oferece..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Capacity */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Capacidade total (pessoas)</label>
                    <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
                      <Users className="h-4 w-4 ml-3 text-muted-foreground" />
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={storeCapacity}
                        onChange={(e) => setStoreCapacity(Number(e.target.value))}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mesas simultâneas</label>
                    <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
                      <LayoutGrid className="h-4 w-4 ml-3 text-muted-foreground" />
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={storeSimTables}
                        onChange={(e) => setStoreSimTables(Number(e.target.value))}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Opening days */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Dias de funcionamento</label>
                  <div className="flex gap-2 flex-wrap">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setStoreOpenDays((prev) =>
                            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                          );
                        }}
                        className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                          storeOpenDays.includes(day)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-muted/20 p-5 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {store ? "Última atualização: " + new Date(store.updated_at).toLocaleDateString("pt-BR") : "Novo cadastro"}
                </p>
                <Button variant="default" onClick={handleSaveStore} disabled={savingStore || !storeName.trim()}>
                  {savingStore ? "Salvando..." : store ? "Salvar alterações" : "Cadastrar luderia"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FEED ─── */}
        {tab === "feed" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-foreground">Publicações no Feed</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Publique novidades, eventos e promoções da sua luderia.</p>
              </div>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Nova publicação
              </Button>
            </div>

            {hasFeedHighlight && (
              <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 flex items-center gap-3">
                <Star className="h-5 w-5 text-secondary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-secondary">Destaque no feed ativo</p>
                  <p className="text-xs text-muted-foreground">Suas publicações aparecem com destaque especial no feed da comunidade.</p>
                </div>
              </div>
            )}

            <EmptyBlock
              icon={<Megaphone className="h-10 w-10" />}
              text="Nenhuma publicação ainda."
              sub="Publique sobre eventos, promoções e novidades da sua luderia."
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Sub-components ── */

function AgendaMesaCard({ mesa, upcoming }: { mesa: Mesa; upcoming?: boolean }) {
  const filled = mesa.seats_total - mesa.seats_available;
  const pct = Math.round((filled / mesa.seats_total) * 100);
  const date = new Date(mesa.start_at);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/mesa/${mesa.id}`)}
      className={`rounded-xl border bg-card p-4 space-y-3 cursor-pointer transition-all hover:shadow-md ${
        upcoming ? "border-primary/20 hover:shadow-primary/10" : "border-border hover:shadow-primary/5"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{mesa.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{mesa.system} · {mesa.gm_name}</p>
        </div>
        <Badge variant={mesa.status === "aberta" ? "default" : "secondary"} className="text-[10px] shrink-0">{mesa.status}</Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dateStr} {timeStr}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{filled}/{mesa.seats_total}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30 transition-all">
        {icon && <span className="pl-3 text-muted-foreground">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
    </div>
  );
}
