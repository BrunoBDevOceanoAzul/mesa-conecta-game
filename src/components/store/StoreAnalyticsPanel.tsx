import { useStoreAnalytics } from "@/hooks/use-store-analytics";
import { Eye, Phone, Globe, MousePointerClick, Share2, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface StoreAnalyticsPanelProps {
  storeId: string;
  storeSlug?: string;
}

export function StoreAnalyticsPanel({ storeId, storeSlug }: StoreAnalyticsPanelProps) {
  const { metrics, loading } = useStoreAnalytics(storeId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Visualizações", value: metrics.pageViews, icon: <Eye className="h-4 w-4 text-primary" /> },
    { label: "Cliques telefone", value: metrics.phoneClicks, icon: <Phone className="h-4 w-4 text-secondary" /> },
    { label: "Cliques site", value: metrics.websiteClicks, icon: <Globe className="h-4 w-4 text-accent" /> },
    { label: "Cliques mesas", value: metrics.mesaClicks, icon: <MousePointerClick className="h-4 w-4 text-primary" /> },
    { label: "Compartilhamentos", value: metrics.shares, icon: <Share2 className="h-4 w-4 text-secondary" /> },
    { label: "Reservas", value: metrics.bookings, icon: <Calendar className="h-4 w-4 text-accent" /> },
  ];

  const publicUrl = storeSlug ? `${window.location.origin}/loja/${storeSlug}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Métricas do perfil (últimos 30 dias)
        </h3>
      </div>

      {publicUrl && (
        <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="text-xs text-primary truncate flex-1">{publicUrl}</code>
          <button
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Copiar
          </button>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">{s.icon}</div>
            <div className="text-xl font-display font-bold text-foreground tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {metrics.viewsByDay.length > 2 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Visualizações por dia</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={metrics.viewsByDay}>
              <defs>
                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(d) => new Date(d + "T12:00").toLocaleDateString("pt-BR")}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="url(#viewGrad)"
                strokeWidth={2}
                name="Views"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
