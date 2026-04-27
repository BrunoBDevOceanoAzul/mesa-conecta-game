import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, TrendingDown, CheckCircle2, AlertTriangle,
  RefreshCw, BarChart3, Users, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CartAbandonment {
  id: string;
  player_name: string | null;
  player_email: string | null;
  mesa_title: string | null;
  gm_user_id: string;
  amount_cents: number;
  status: string;
  abandoned_at: string;
  recovered_at: string | null;
  remarketing_sent_at: string | null;
  remarketing_channel: string | null;
}

export function CartAbandonmentDashboard() {
  const [data, setData] = useState<CartAbandonment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gmNames, setGmNames] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("cart_abandonments")
      .select("*")
      .order("abandoned_at", { ascending: false })
      .limit(500);
    const items = (rows as unknown as CartAbandonment[]) || [];
    setData(items);

    // Fetch GM names
    const gmIds = [...new Set(items.map(i => i.gm_user_id))];
    if (gmIds.length > 0) {
      const { data: profiles } = await (supabase
        .from("profiles")
        .select("user_id, display_name, name") as any)
        .in("user_id", gmIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.user_id] = p.display_name || p.name || "—"; });
      setGmNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const abandoned = data.filter(d => d.status === "abandoned");
    const recovered = data.filter(d => d.status === "recovered");
    const remarketingSent = data.filter(d => d.remarketing_sent_at);
    const recoveredAfterRemarketing = recovered.filter(r => r.remarketing_sent_at);
    const lostRevenue = abandoned.reduce((s, a) => s + (a.amount_cents || 0), 0);
    const recoveredRevenue = recovered.reduce((s, a) => s + (a.amount_cents || 0), 0);
    const last7d = data.filter(d => isAfter(new Date(d.abandoned_at), subDays(new Date(), 7)));
    const last7dRecovered = last7d.filter(d => d.status === "recovered");

    // Per-GM breakdown
    const perGm: Record<string, { abandoned: number; recovered: number; total: number }> = {};
    data.forEach(d => {
      if (!perGm[d.gm_user_id]) perGm[d.gm_user_id] = { abandoned: 0, recovered: 0, total: 0 };
      perGm[d.gm_user_id].total++;
      if (d.status === "abandoned") perGm[d.gm_user_id].abandoned++;
      if (d.status === "recovered") perGm[d.gm_user_id].recovered++;
    });

    return {
      total,
      abandonedCount: abandoned.length,
      recoveredCount: recovered.length,
      recoveryRate: total > 0 ? Math.round((recovered.length / total) * 100) : 0,
      lostRevenue,
      recoveredRevenue,
      remarketingSent: remarketingSent.length,
      remarketingConversion: remarketingSent.length > 0
        ? Math.round((recoveredAfterRemarketing.length / remarketingSent.length) * 100)
        : 0,
      last7dTotal: last7d.length,
      last7dRecovered: last7dRecovered.length,
      perGm,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Abandono de Carrinho
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão plataforma — checkouts iniciados e não concluídos.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {/* Global metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Checkouts" value={String(stats.total)} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Abandonados" value={String(stats.abandonedCount)} accent />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Recuperados" value={`${stats.recoveredCount} (${stats.recoveryRate}%)`} />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Receita Perdida" value={`R$${(stats.lostRevenue / 100).toFixed(0)}`} accent />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Receita Recuperada" value={`R$${(stats.recoveredRevenue / 100).toFixed(0)}`} />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Conv. Remarketing"
          value={`${stats.remarketingConversion}%`}
          sub={`${stats.remarketingSent} envios`}
        />
      </div>

      {/* 7-day summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Últimos 7 dias</h3>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">
            Abandonos: <strong className="text-foreground">{stats.last7dTotal}</strong>
          </span>
          <span className="text-muted-foreground">
            Recuperados: <strong className="text-green-500">{stats.last7dRecovered}</strong>
          </span>
          <span className="text-muted-foreground">
            Taxa: <strong className="text-foreground">
              {stats.last7dTotal > 0 ? Math.round((stats.last7dRecovered / stats.last7dTotal) * 100) : 0}%
            </strong>
          </span>
        </div>
      </div>

      {/* Per-GM breakdown */}
      {Object.keys(stats.perGm).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Por Mestre
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mestre</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Abandonados</TableHead>
                <TableHead>Recuperados</TableHead>
                <TableHead>Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(stats.perGm)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([gmId, s]) => (
                  <TableRow key={gmId}>
                    <TableCell className="font-medium">{gmNames[gmId] || gmId.slice(0, 8)}</TableCell>
                    <TableCell>{s.total}</TableCell>
                    <TableCell>{s.abandoned}</TableCell>
                    <TableCell className="text-green-500">{s.recovered}</TableCell>
                    <TableCell>
                      <Badge variant={s.total > 0 && (s.recovered / s.total) >= 0.5 ? "default" : "secondary"} className="text-[10px]">
                        {s.total > 0 ? Math.round((s.recovered / s.total) * 100) : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Recent abandonments table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Abandonos Recentes</h3>
        {loading ? (
          <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogador</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Mestre</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Remarketing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 50).map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{a.player_name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{a.player_email || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.mesa_title || "—"}</TableCell>
                  <TableCell className="text-sm">{gmNames[a.gm_user_id] || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">
                    R${((a.amount_cents || 0) / 100).toFixed(2).replace(".", ",")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={a.status === "recovered" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {a.status === "recovered" ? "Recuperado" : "Abandonado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.abandoned_at), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.remarketing_sent_at ? (
                      <span className="text-green-500">{a.remarketing_channel}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
