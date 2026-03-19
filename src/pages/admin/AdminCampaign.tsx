import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Users, Crown, Store, TrendingUp, MessageSquare, DollarSign, UserCheck, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "./AdminLayout";
import { PricingInsights } from "@/components/admin/PricingInsights";

interface Lead {
  id: string;
  name: string;
  email: string;
  city: string | null;
  state: string | null;
  selected_roles_json: string[];
  primary_role: string | null;
  interest_score: number | null;
  cluster_label: string | null;
  high_intent_lead: boolean;
  likely_paid_user: boolean;
  likely_founder: boolean;
  wants_followup: boolean;
  willingness_to_pay: string | null;
  early_adopter_interest: string | null;
  created_at: string;
}

export default function AdminCampaign() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("interest_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads((data as any) || []);
        setLoading(false);
      });
  }, []);

  const total = leads.length;
  const players = leads.filter((l) => l.selected_roles_json?.includes("player")).length;
  const gms = leads.filter((l) => l.selected_roles_json?.includes("gm")).length;
  const stores = leads.filter((l) => l.selected_roles_json?.includes("store")).length;
  const highIntent = leads.filter((l) => l.high_intent_lead).length;
  const likelyPaid = leads.filter((l) => l.likely_paid_user).length;
  const likelyFounder = leads.filter((l) => l.likely_founder).length;
  const wantFollowup = leads.filter((l) => l.wants_followup).length;

  // Cities breakdown
  const cityCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const c = l.city || "N/A";
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Cluster breakdown
  const clusterCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const c = l.cluster_label || "indefinido";
    clusterCounts[c] = (clusterCounts[c] || 0) + 1;
  });

  const clusterColors: Record<string, string> = {
    early_adopter_forte: "default",
    alto_interesse: "secondary",
    interesse_moderado: "outline",
    curioso: "outline",
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-h1 mb-2">📊 Campanha de Interesse</h1>
          <p className="text-body-sm text-muted-foreground">Resultados do formulário de anamnese para validação de mercado.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total de respostas" value={String(total)} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Jogadores" value={String(players)} />
          <StatCard icon={<Crown className="h-5 w-5" />} label="Mestres" value={String(gms)} />
          <StatCard icon={<Store className="h-5 w-5" />} label="Lojas" value={String(stores)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Alto interesse" value={String(highIntent)} accent />
          <StatCard icon={<DollarSign className="h-5 w-5" />} label="Provável pagante" value={String(likelyPaid)} accent />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label="Provável founder" value={String(likelyFounder)} accent />
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Quer conversar" value={String(wantFollowup)} />
        </div>

        {/* Clusters + Cities */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(clusterCounts).map(([cluster, count]) => (
                  <div key={cluster} className="flex items-center justify-between">
                    <Badge variant={(clusterColors[cluster] as any) || "outline"}>
                      {cluster.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Cidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topCities.map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{city}</span>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                ))}
                {topCities.length === 0 && <p className="text-caption">Nenhuma resposta ainda.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads ({total})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Perfis</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{lead.email}</TableCell>
                    <TableCell className="text-xs">{lead.city || "—"}, {lead.state || ""}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.selected_roles_json?.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${(lead.interest_score || 0) >= 40 ? "text-success" : "text-muted-foreground"}`}>
                        {lead.interest_score || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(clusterColors[lead.cluster_label || ""] as any) || "outline"} className="text-[10px]">
                        {(lead.cluster_label || "—").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.high_intent_lead && <Badge className="text-[10px] bg-success/20 text-success border-0">intent</Badge>}
                        {lead.likely_founder && <Badge className="text-[10px] bg-secondary/20 text-secondary border-0">founder</Badge>}
                        {lead.wants_followup && <Badge className="text-[10px] bg-info/20 text-info border-0">followup</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      Nenhuma resposta ainda. Divulgue o link /interesse.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
