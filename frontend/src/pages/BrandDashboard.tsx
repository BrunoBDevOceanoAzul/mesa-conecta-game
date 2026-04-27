import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandDashboard } from "@/hooks/use-brand-dashboard";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, BarChart3, Megaphone, Eye, MousePointerClick, DollarSign, TrendingUp, Target, Users, Layers, Lightbulb, FileText, Image, PieChart, ArrowRight, Plus, Pause, Play, Copy, MoreHorizontal, MapPin, Gamepad2, Sparkles, Zap } from "lucide-react";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import { useState } from "react";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";
import { BrandOverviewBlock } from "@/components/brand/BrandOverviewBlock";
import { BrandPerformanceBlock } from "@/components/brand/BrandPerformanceBlock";
import { BrandCampaignsBlock } from "@/components/brand/BrandCampaignsBlock";
import { BrandAssetsBlock } from "@/components/brand/BrandAssetsBlock";
import { BrandSegmentationBlock } from "@/components/brand/BrandSegmentationBlock";
import { BrandOpportunitiesBlock } from "@/components/brand/BrandOpportunitiesBlock";

const navItems = [
  { label: "Painel", path: "/dashboard/marca", icon: <Building2 className="h-4 w-4" /> },
  { label: "Campanhas", path: "/dashboard/marca", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <FileText className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <TrendingUp className="h-4 w-4" /> },
];

type Tab = "overview" | "campaigns" | "assets";

export default function BrandDashboard() {
  const { user } = useAuth();
  const { loading, error, campaigns, posts, assets, profile, overview } = useBrandDashboard();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const userName = profile?.company_name || user?.user_metadata?.name || "Marca";

  if (loading) {
    return (
      <DashboardLayout role="brand" navItems={navItems} userName={userName}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="brand" navItems={navItems} userName={userName}>
        <EmptyState
          icon={<BarChart3 className="h-10 w-10" />}
          title="Erro ao carregar dados"
          description="Não foi possível carregar o painel da marca. Tente novamente."
          action="Recarregar"
          onAction={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="brand" navItems={navItems} userName={userName}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Sua presença na HIVIUM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe campanhas, alcance e performance da sua marca na comunidade.
            </p>
          </div>
          <Button variant="gradient" size="default" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mt-6 p-1 rounded-xl bg-surface w-fit">
          {([
            { key: "overview" as Tab, label: "Visão Geral", icon: PieChart },
            { key: "campaigns" as Tab, label: "Campanhas", icon: Megaphone },
            { key: "assets" as Tab, label: "Ativos", icon: Layers },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <BrandOverviewBlock overview={overview} />
          <BrandPerformanceBlock posts={posts} campaigns={campaigns} />
          <BrandSegmentationBlock profile={profile} campaigns={campaigns} />
          <BrandOpportunitiesBlock overview={overview} posts={posts} campaigns={campaigns} />

          {/* Instagram CTA */}
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15">
                <Instagram className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Siga a HIVIUM no Instagram</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fique por dentro de novidades e oportunidades — {getInstagramHandle()}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={getInstagramUrl("store_dashboard")} target="_blank" rel="noopener noreferrer">
                  Seguir
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "campaigns" && (
        <BrandCampaignsBlock campaigns={campaigns} assets={assets} />
      )}

      {activeTab === "assets" && (
        <BrandAssetsBlock posts={posts} assets={assets} campaigns={campaigns} />
      )}
    </DashboardLayout>
  );
}
