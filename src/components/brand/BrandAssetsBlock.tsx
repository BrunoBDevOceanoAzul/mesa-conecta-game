import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Image, Eye, MousePointerClick, Layers } from "lucide-react";
import type { BrandPost, CampaignAsset, BrandCampaign } from "@/hooks/use-brand-dashboard";

interface Props {
  posts: BrandPost[];
  assets: CampaignAsset[];
  campaigns: BrandCampaign[];
}

export function BrandAssetsBlock({ posts, assets, campaigns }: Props) {
  if (posts.length === 0 && assets.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-10 w-10" />}
        title="Nenhum ativo da marca"
        description="Posts patrocinados e criativos de campanhas aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground">Ativos & Posts Patrocinados</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((p) => {
          const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : "0.0";
          return (
            <Card key={p.id} className="overflow-hidden group hover:border-primary/20 transition-colors">
              {p.image_url && (
                <div className="h-36 bg-muted overflow-hidden">
                  <img src={p.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <CardContent className={p.image_url ? "p-4" : "p-4"}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.title || p.content.slice(0, 50)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{p.post_type}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {p.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.impressions.toLocaleString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" /> {p.clicks.toLocaleString("pt-BR")}
                  </span>
                  <span>CTR {ctr}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Show raw assets that aren't posts */}
        {assets.filter((a) => a.asset_type !== "post").map((a) => {
          const campaign = campaigns.find((c) => c.id === a.campaign_id);
          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Image className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">{a.asset_type}</p>
                    {campaign && (
                      <p className="text-xs text-muted-foreground truncate">{campaign.title}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
