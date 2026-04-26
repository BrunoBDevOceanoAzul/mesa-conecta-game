import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Gamepad2, DollarSign, Target } from "lucide-react";
import type { BrandProfile, BrandCampaign } from "@/hooks/use-brand-dashboard";

interface Props {
  profile: BrandProfile | null;
  campaigns: BrandCampaign[];
}

interface SegmentItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function BrandSegmentationBlock({ profile, campaigns }: Props) {
  const audience = profile?.target_audience_json;
  const hasAudience = Array.isArray(audience) && audience.length > 0;

  const segments: SegmentItem[] = [
    {
      icon: <Users className="h-4 w-4 text-primary" />,
      label: "Perfis-alvo",
      value: hasAudience
        ? (audience as string[]).join(", ")
        : "Jogadores, Mestres, Lojas",
    },
    {
      icon: <MapPin className="h-4 w-4 text-secondary" />,
      label: "Regiões",
      value: profile?.category || "Nacional",
    },
    {
      icon: <Gamepad2 className="h-4 w-4 text-info" />,
      label: "Sistemas / Interesses",
      value: "D&D 5e, Call of Cthulhu, Tormenta20",
    },
    {
      icon: <DollarSign className="h-4 w-4 text-success" />,
      label: "Faixa de Ticket",
      value: profile?.monthly_budget
        ? `Até R$ ${profile.monthly_budget.toLocaleString("pt-BR")}/mês`
        : "Não definido",
    },
    {
      icon: <Target className="h-4 w-4 text-warning" />,
      label: "Objetivo Principal",
      value: profile?.campaign_goal || "Awareness & comunidade",
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">Segmentação & Público</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {segments.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
