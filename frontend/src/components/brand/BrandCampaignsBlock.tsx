import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Megaphone, Plus, Eye, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BrandCampaign, CampaignAsset } from "@/hooks/use-brand-dashboard";
import { useState } from "react";

interface Props {
  campaigns: BrandCampaign[];
  assets: CampaignAsset[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Ativa", className: "bg-success/15 text-success border-success/20" },
  paused: { label: "Pausada", className: "bg-warning/15 text-warning border-warning/20" },
  completed: { label: "Encerrada", className: "bg-primary/15 text-primary border-primary/20" },
  canceled: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/20" },
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd MMM yyyy", { locale: ptBR });
}

export function BrandCampaignsBlock({ campaigns, assets }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = campaigns.find((c) => c.id === selectedId);

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="h-10 w-10" />}
        title="Nenhuma campanha criada"
        description="Crie sua primeira campanha para alcançar jogadores, mestres e lojas dentro da HIVIUM."
        action="Criar Campanha"
        onAction={() => {}}
      />
    );
  }

  if (selected) {
    const campaignAssets = assets.filter((a) => a.campaign_id === selected.id);
    const st = statusConfig[selected.status || "draft"] || statusConfig.draft;
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-2">
          ← Voltar para campanhas
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-foreground">{selected.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selected.objective || "Sem objetivo definido"}</p>
          </div>
          <Badge variant="outline" className={st.className}>{st.label}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Orçamento</p>
              <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(selected.budget_amount || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm font-medium text-foreground mt-1">
                {formatDate(selected.start_at)} — {formatDate(selected.end_at)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="text-sm font-medium text-foreground mt-1">{selected.campaign_type || "Interno"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ativos Vinculados</p>
              <p className="text-lg font-bold text-foreground mt-1">{campaignAssets.length}</p>
            </CardContent>
          </Card>
        </div>

        {campaignAssets.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignAssets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium capitalize">{a.asset_type}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{a.reference_id || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(a.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground">Campanhas</h2>
        <Button variant="gradient" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Objetivo</TableHead>
                <TableHead className="hidden md:table-cell">Período</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const st = statusConfig[c.status || "draft"] || statusConfig.draft;
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedId(c.id)}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${st.className}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {c.objective || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {formatDate(c.start_at)} — {formatDate(c.end_at)}
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.budget_amount || 0)}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
