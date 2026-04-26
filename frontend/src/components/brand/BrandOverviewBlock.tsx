import { StatCard } from "@/components/shared/StatCard";
import { Megaphone, Eye, MousePointerClick, DollarSign, Target, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import type { BrandOverview } from "@/hooks/use-brand-dashboard";

interface Props {
  overview: BrandOverview;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatNumber(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toString();
}

export function BrandOverviewBlock({ overview }: Props) {
  return (
    <section>
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">Resumo do Período</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Megaphone className="h-5 w-5" />}
          label="Campanhas Ativas"
          value={overview.activeCampaigns.toString()}
          sub={`${overview.completedCampaigns} encerradas`}
          accent
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Orçamento Total"
          value={formatCurrency(overview.totalBudget)}
          sub={`${formatCurrency(overview.totalSpent)} investido`}
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Impressões"
          value={formatNumber(overview.totalImpressions)}
          trend={overview.totalImpressions > 0 ? "+12% vs. anterior" : undefined}
        />
        <StatCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Cliques"
          value={formatNumber(overview.totalClicks)}
          sub={`CTR ${overview.avgCTR.toFixed(2)}%`}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Conversões"
          value={overview.totalConversions.toString()}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="CTR Médio"
          value={`${overview.avgCTR.toFixed(2)}%`}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Gasto no Período"
          value={formatCurrency(overview.totalSpent)}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Saldo Disponível"
          value={formatCurrency(Math.max(0, overview.totalBudget - overview.totalSpent))}
          accent
        />
      </div>
    </section>
  );
}
