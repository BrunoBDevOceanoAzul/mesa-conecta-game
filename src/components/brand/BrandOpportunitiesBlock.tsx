import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, MapPin, Zap, Sparkles } from "lucide-react";
import type { BrandOverview, BrandPost, BrandCampaign } from "@/hooks/use-brand-dashboard";

interface Props {
  overview: BrandOverview;
  posts: BrandPost[];
  campaigns: BrandCampaign[];
}

interface Insight {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export function BrandOpportunitiesBlock({ overview, posts, campaigns }: Props) {
  const insights: Insight[] = [];

  if (overview.activeCampaigns === 0) {
    insights.push({
      icon: <Sparkles className="h-5 w-5 text-secondary" />,
      title: "Crie sua primeira campanha",
      description: "Marcas com campanhas ativas alcançam em média 3x mais visibilidade na comunidade.",
      priority: "high",
    });
  }

  if (overview.avgCTR > 2) {
    insights.push({
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      title: "CTR acima da média",
      description: `Seu CTR de ${overview.avgCTR.toFixed(1)}% está excelente. Considere aumentar o orçamento para escalar resultados.`,
      priority: "medium",
    });
  }

  if (posts.length > 0) {
    const topPost = [...posts].sort((a, b) => b.clicks - a.clicks)[0];
    if (topPost) {
      insights.push({
        icon: <Zap className="h-5 w-5 text-primary" />,
        title: "Formato com maior engajamento",
        description: `Seu post "${(topPost.title || topPost.content).slice(0, 30)}…" teve o melhor desempenho. Replique esse formato.`,
        priority: "medium",
      });
    }
  }

  insights.push({
    icon: <MapPin className="h-5 w-5 text-info" />,
    title: "Explore novas regiões",
    description: "São Paulo e Belo Horizonte concentram a maior comunidade de RPG. Considere segmentar campanhas para essas cidades.",
    priority: "low",
  });

  insights.push({
    icon: <Lightbulb className="h-5 w-5 text-warning" />,
    title: "Público com potencial de expansão",
    description: "Mestres profissionais são o segmento com maior poder de conversão. Campanhas focadas nesse perfil geram até 5x mais reservas.",
    priority: "low",
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <section>
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">Oportunidades de Expansão</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <Card key={i} className={i === 0 ? "border-secondary/20 bg-secondary/5" : ""}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                {ins.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{ins.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
