import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Crown, Calendar, Users, BarChart3, CreditCard, TrendingUp,
  Megaphone, Plus, Eye, MousePointerClick, DollarSign,
  PieChart, Edit2, Trash2, ChevronDown, Calculator,
  UserCheck, MessageSquare, Tag, Clock, Zap, Trophy, Target, Share2, Star, Instagram
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { useSubscription } from "@/hooks/use-subscription";
import { PremiumGate, PremiumBanner } from "@/components/shared/PremiumGate";
import { ProgressionPanel } from "@/components/gm/ProgressionPanel";
import { PricingCalculator } from "@/components/gm/PricingCalculator";
import { IncomeGoalTracker } from "@/components/gm/IncomeGoalTracker";
import { ShareAnalyticsPanel } from "@/components/gm/ShareAnalyticsPanel";
import { ShareButton } from "@/components/shared/ShareModal";
import { ConnectStatusBlock } from "@/components/dashboard/ConnectStatusBlock";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReputationBadge } from "@/components/reviews/ReputationBadge";
import { useGMReviews } from "@/hooks/use-reviews";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";
import { CreateMesaDialog } from "@/components/mesa/CreateMesaDialog";
import { ContentStudioPanel } from "@/components/gm/ContentStudioPanel";
import { CartAbandonmentPanel } from "@/components/gm/CartAbandonmentPanel";
import { toast } from "sonner";
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog";

type Mesa = any;

const navItems = [
  { label: "Início", path: "/dashboard/mestre", icon: <Crown className="h-4 w-4" /> },
  { label: "Agenda", path: "/agenda", icon: <Calendar className="h-4 w-4" /> },
  { label: "Destaque", path: "/boost", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Assinatura", path: "/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <Megaphone className="h-4 w-4" /> },
];

type Tab = "overview" | "mesas" | "crm" | "calc" | "progression" | "analytics" | "reviews" | "studio";

// Calculator presets (legacy - now using PricingCalculator component)

// CRM lead stages
const stageConfig: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  interessado: { label: "Interessado", color: "bg-secondary/15 text-secondary border-secondary/20" },
  confirmado: { label: "Confirmado", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  recorrente: { label: "Recorrente", color: "bg-primary/15 text-primary border-primary/20" },
};

interface CRMLead {
  id: string;
  name: string;
  stage: string;
  tags: string[];
  notes: string;
  sourceMesa: string;
  lastContact: string;
}

import { StatCard } from "@/components/shared/StatCard";

export default function GMDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();
  const [tab, setTab] = useState<Tab>("overview");
  const displayName = user?.user_metadata?.name || "Mestre";
  const isPremium = sub.isActive;
  const gmReviews = useGMReviews(user?.id);
  // Real mesas
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(true);

  const fetchMesas = () => {
    if (!user) return;
    supabase
      .from("mesas")
      .select("*")
      .eq("gm_id", user.id)
      .order("start_at", { ascending: false })
      .then(({ data }) => {
        setMesas(data || []);
        setLoadingMesas(false);
      });
  };

  useEffect(() => {
    fetchMesas();
  }, [user]);

  // Derived stats
  const activeMesas = mesas.filter((m) => m.status === "aberta");
  const totalSeats = mesas.reduce((s, m) => s + m.seats_total, 0);
  const filledSeats = mesas.reduce((s, m) => s + (m.seats_total - m.seats_available), 0);
  const occupancyRate = totalSeats > 0 ? Math.round((filledSeats / totalSeats) * 100) : 0;
  const estimatedRevenue = mesas.reduce((s, m) => {
    const filled = m.seats_total - m.seats_available;
    return s + filled * (m.min_price || 0);
  }, 0);

  // (Old calculator state removed — now using PricingCalculator component)

  // Mock CRM leads (will be real when reservations exist)
  const [leads] = useState<CRMLead[]>([]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Visão Geral", icon: <PieChart className="h-4 w-4" /> },
    { key: "progression", label: "Progressão", icon: <Trophy className="h-4 w-4" /> },
    { key: "reviews", label: "Avaliações", icon: <Star className="h-4 w-4" /> },
    { key: "mesas", label: "Minhas Mesas", icon: <Calendar className="h-4 w-4" /> },
    { key: "crm", label: "CRM / Leads", icon: <Users className="h-4 w-4" /> },
    { key: "calc", label: "Calculadora", icon: <Calculator className="h-4 w-4" /> },
    { key: "analytics", label: "Atribuição", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "studio", label: "Estúdio IA", icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="gm" navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Painel do Mestre <Crown className="h-5 w-5 text-secondary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie mesas, leads e métricas do seu negócio.</p>
          </div>
          <CreateMesaDialog role="gm" onCreated={fetchMesas} />
        </div>

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

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Subscription banner for non-subscribers */}
            {!sub.loading && !isPremium && (
              <PremiumBanner
                message="Ative seu plano para desbloquear CRM, analytics avançados e destaque."
                ctaLabel="Ver planos"
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard icon={<Calendar className="h-5 w-5" />} label="Mesas Ativas" value={String(activeMesas.length)} />
              <StatCard icon={<UserCheck className="h-5 w-5" />} label="Reservas" value={String(filledSeats)} />
              <StatCard icon={<PieChart className="h-5 w-5" />} label="Ocupação" value={`${occupancyRate}%`} />
              <StatCard icon={<Eye className="h-5 w-5" />} label="Impressões (7d)" value={isPremium ? "—" : "🔒"} />
              <StatCard icon={<MousePointerClick className="h-5 w-5" />} label="Cliques (7d)" value={isPremium ? "—" : "🔒"} />
              <StatCard icon={<DollarSign className="h-5 w-5" />} label="Receita Est." value={isPremium ? `R$${estimatedRevenue.toFixed(0)}` : "🔒"} />
            </div>

            {/* Income Goal + Connect Status + Quick mesas list */}
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <IncomeGoalTracker />
                <ConnectStatusBlock />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-foreground mb-3">Mesas Recentes</h2>
                {mesas.length === 0 ? (
                  <EmptyBlock
                    icon={<Calendar className="h-10 w-10" />}
                    text="Nenhuma mesa criada ainda."
                    sub="Crie sua primeira mesa e comece a receber jogadores."
                  />
                ) : (
                  <div className="grid gap-3">
                    {mesas.slice(0, 4).map((m) => (
                      <MesaMiniCard key={m.id} mesa={m} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PROGRESSION ─── */}
        {tab === "progression" && (
          <div className="max-w-2xl">
            <ProgressionPanel />
          </div>
        )}

        {/* ─── REVIEWS ─── */}
        {tab === "reviews" && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-foreground">Suas Avaliações</h2>
                <p className="text-xs text-muted-foreground mt-0.5">O que jogadores dizem sobre suas mesas.</p>
              </div>
              {gmReviews.stats.totalReviews > 0 && (
                <ReputationBadge
                  rating={gmReviews.stats.avgRating}
                  totalReviews={gmReviews.stats.totalReviews}
                  size="lg"
                />
              )}
            </div>
            <ReviewsList reviewedUserId={user?.id} reviewType="gm" showReputation={false} />
          </div>
        )}

        {/* ─── MESAS MANAGEMENT ─── */}
        {tab === "mesas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-foreground">Gestão de Mesas</h2>
              <CreateMesaDialog role="gm" onCreated={fetchMesas} />
            </div>
            {loadingMesas ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : mesas.length === 0 ? (
              <EmptyBlock
                icon={<Calendar className="h-10 w-10" />}
                text="Nenhuma mesa encontrada."
                sub="Crie mesas para que jogadores possam encontrá-las."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mesas.map((m) => (
                  <MesaManageCard key={m.id} mesa={m} onDeleted={fetchMesas} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CRM ─── */}
        {tab === "crm" && (
          <PremiumGate
            feature="CRM de Leads"
            description="Acompanhe leads e jogadores que interagiram com suas mesas. Recurso disponível para assinantes ativos."
            allowed={isPremium}
            loading={sub.loading}
          >
            <div className="space-y-8">
              {/* Cart Abandonment */}
              <CartAbandonmentPanel />

              {/* Lead funnel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-display font-semibold text-foreground">Mini CRM</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Acompanhe leads e jogadores que interagiram com suas mesas.</p>
                  </div>
                </div>

                {/* Stage funnel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(stageConfig).map(([key, cfg]) => {
                    const count = leads.filter((l) => l.stage === key).length;
                    return (
                      <div key={key} className={`rounded-xl border p-4 text-center ${cfg.color}`}>
                        <p className="text-2xl font-display font-bold">{count}</p>
                        <p className="text-xs font-medium mt-1">{cfg.label}</p>
                      </div>
                    );
                  })}
                </div>

                {leads.length === 0 ? (
                  <EmptyBlock
                    icon={<Users className="h-10 w-10" />}
                    text="Nenhum lead ainda."
                    sub="Jogadores aparecerão aqui conforme se inscreverem nas suas mesas."
                  />
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jogador</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estágio</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tags</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Mesa de Origem</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Observações</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageConfig[lead.stage]?.color || ""}`}>
                                {stageConfig[lead.stage]?.label || lead.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {lead.tags.map((t) => (
                                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.sourceMesa}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell truncate max-w-[180px]">{lead.notes}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{lead.lastContact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </PremiumGate>
        )}

        {/* ─── CALCULATOR ─── */}
        {tab === "calc" && (
          <div className="max-w-4xl">
            <PricingCalculator />
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {tab === "analytics" && (
          <PremiumGate
            feature="Atribuição por Canal"
            description="Veja de onde vêm suas visitas e reservas. Recurso para assinantes."
            allowed={isPremium}
            loading={sub.loading}
          >
            <ShareAnalyticsPanel />
          </PremiumGate>
        )}

        {/* ─── CONTENT STUDIO ─── */}
        {tab === "studio" && (
          <div className="max-w-4xl">
            <ContentStudioPanel mesas={mesas} />
          </div>
        )}

        {/* Instagram follow */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Instagram className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Siga a HIVIUM no Instagram</p>
            <p className="text-xs text-muted-foreground">Divulgue suas mesas, conecte-se com a comunidade.</p>
          </div>
          <a href={getInstagramUrl("gm_dashboard")} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Instagram className="h-3.5 w-3.5" /> {getInstagramHandle()}
            </Button>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Sub-components ── */

import { EmptyState } from "@/components/shared/EmptyState";

function EmptyBlock({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return <EmptyState icon={icon} title={text} description={sub} />;
}

function MesaMiniCard({ mesa }: { mesa: Mesa }) {
  const filled = mesa.seats_total - mesa.seats_available;
  const pct = Math.round((filled / mesa.seats_total) * 100);
  const date = new Date(mesa.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{mesa.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{mesa.system} · {date}</p>
        </div>
        <Badge variant={mesa.status === "aberta" ? "default" : "secondary"} className="text-[10px] shrink-0">
          {mesa.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{filled}/{mesa.seats_total}</span>
      </div>
    </div>
  );
}

function MesaManageCard({ mesa, onDeleted }: { mesa: Mesa; onDeleted?: () => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const filled = mesa.seats_total - mesa.seats_available;
  const pct = Math.round((filled / mesa.seats_total) * 100);
  const date = new Date(mesa.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("mesas").delete().eq("id", mesa.id);
    if (error) {
      toast.error("Erro ao excluir mesa: " + error.message);
    } else {
      toast.success("Mesa excluída com sucesso.");
      onDeleted?.();
    }
    setDeleting(false);
    setShowDelete(false);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all group">
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{mesa.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{mesa.system}</p>
            </div>
            <Badge variant={mesa.status === "aberta" ? "default" : "secondary"} className="text-[10px] shrink-0">
              {mesa.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" /> {date}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3" /> {filled}/{mesa.seats_total} vagas
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3 w-3" /> R${mesa.min_price || 0}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
              <Tag className="h-3 w-3" /> {mesa.format}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-secondary" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{pct}%</span>
          </div>
        </div>

        <div className="flex border-t border-border divide-x divide-border opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
            <Edit2 className="h-3 w-3" /> Editar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Excluir
          </button>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Mesa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{mesa.title}"</strong>? Esta ação é permanente e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CalcInput({ label, value, onChange, min, max, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="mt-1.5 flex items-center rounded-lg border border-border bg-surface focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary/40 transition-all">
        {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center transition-all ${
      highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
    }`}>
      <p className={`text-base font-display font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
