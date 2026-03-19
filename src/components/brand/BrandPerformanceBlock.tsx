import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import type { BrandCampaign, BrandPost } from "@/hooks/use-brand-dashboard";

interface Props {
  posts: BrandPost[];
  campaigns: BrandCampaign[];
}

function PerformanceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toLocaleString("pt-BR")}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BrandPerformanceBlock({ posts, campaigns }: Props) {
  const maxImpressions = Math.max(...posts.map((p) => p.impressions), 1);
  const topPosts = [...posts].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  const bestCampaign = campaigns.length > 0
    ? campaigns.reduce((best, c) => (!best || (c.budget_amount || 0) > (best.budget_amount || 0) ? c : best), campaigns[0])
    : null;

  if (posts.length === 0 && campaigns.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Desempenho Recente</h2>
        <EmptyState
          icon={<BarChart3 className="h-10 w-10" />}
          title="Sem dados de performance ainda"
          description="Crie sua primeira campanha para acompanhar métricas de alcance e conversão."
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">Desempenho Recente</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top posts by clicks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              Posts com Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum post patrocinado encontrado.</p>
            ) : (
              topPosts.map((p) => (
                <PerformanceBar
                  key={p.id}
                  label={p.title || p.content.slice(0, 40) + "…"}
                  value={p.clicks}
                  max={Math.max(...topPosts.map((x) => x.clicks), 1)}
                  color="bg-primary"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Impressions breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-secondary" />
              Impressões por Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
            ) : (
              topPosts.map((p) => (
                <PerformanceBar
                  key={p.id}
                  label={p.title || p.content.slice(0, 40) + "…"}
                  value={p.impressions}
                  max={maxImpressions}
                  color="bg-secondary"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Best campaign card */}
        {bestCampaign && (
          <Card className="md:col-span-2 border-primary/15">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Campanha com melhor resultado</p>
                <p className="text-base font-semibold text-foreground mt-0.5">{bestCampaign.title}</p>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary shrink-0">
                {bestCampaign.status || "draft"}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
