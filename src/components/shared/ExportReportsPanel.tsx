import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Calendar, Users, DollarSign, Loader2, BarChart3 } from "lucide-react";

type ReportType = "bookings" | "mesas" | "revenue";

interface ExportReportsPanelProps {
  role: "gm" | "store";
}

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportReportsPanel({ role }: ExportReportsPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<ReportType | null>(null);

  const exportBookings = async () => {
    if (!user) return;
    setLoading("bookings");
    try {
      const col = role === "gm" ? "gm_user_id" : "store_user_id";
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, amount, currency, seats_reserved, booked_at, player_user_id, game_table_id, payment_status")
        .eq(col, user.id)
        .order("booked_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data?.length) {
        toast({ title: "Sem dados", description: "Nenhuma reserva encontrada para exportar." });
        return;
      }

      const headers = ["ID", "Status", "Valor", "Moeda", "Vagas", "Data", "Jogador ID", "Mesa ID", "Pagamento"];
      const rows = data.map((b: any) => [
        b.id, b.status || "", String(b.amount || 0), b.currency || "BRL",
        String(b.seats_reserved || 1), b.booked_at || "", b.player_user_id || "",
        b.game_table_id || "", b.payment_status || "",
      ]);
      downloadCSV(`hivium-reservas-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows));
      toast({ title: "Exportado!", description: `${data.length} reservas exportadas.` });
    } catch (err: any) {
      toast({ title: "Erro na exportação", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const exportMesas = async () => {
    if (!user) return;
    setLoading("mesas");
    try {
      const col = role === "gm" ? "gm_id" : "store_id";
      const { data, error } = await supabase
        .from("mesas")
        .select("id, title, system, format, session_type, city, min_price, max_price, seats_total, seats_available, status, start_at, end_at")
        .eq(col, user.id)
        .order("start_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data?.length) {
        toast({ title: "Sem dados", description: "Nenhuma mesa encontrada." });
        return;
      }

      const headers = ["ID", "Título", "Sistema", "Formato", "Tipo", "Cidade", "Preço Mín", "Preço Máx", "Vagas Total", "Vagas Disp.", "Status", "Início", "Término"];
      const rows = data.map((m: any) => [
        m.id, m.title, m.system, m.format, m.session_type, m.city || "",
        String(m.min_price), String(m.max_price), String(m.seats_total),
        String(m.seats_available), m.status, m.start_at || "", m.end_at || "",
      ]);
      downloadCSV(`hivium-mesas-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows));
      toast({ title: "Exportado!", description: `${data.length} mesas exportadas.` });
    } catch (err: any) {
      toast({ title: "Erro na exportação", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const exportRevenue = async () => {
    if (!user) return;
    setLoading("revenue");
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, amount, currency, booked_at, status, payment_status")
        .eq(role === "gm" ? "gm_user_id" : "store_user_id", user.id)
        .in("status", ["confirmed", "completed"])
        .eq("payment_status", "paid")
        .order("booked_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data?.length) {
        toast({ title: "Sem dados", description: "Nenhum recebimento encontrado." });
        return;
      }

      const total = data.reduce((acc: number, b: any) => acc + (b.amount || 0), 0);
      const headers = ["ID", "Valor", "Moeda", "Data", "Status", "Pagamento"];
      const rows = data.map((b: any) => [
        b.id, String(b.amount || 0), b.currency || "BRL",
        b.booked_at || "", b.status || "", b.payment_status || "",
      ]);
      // Add total row
      rows.push(["", String(total), "BRL", "", "TOTAL", ""]);
      downloadCSV(`hivium-receita-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows));
      toast({ title: "Exportado!", description: `${data.length} transações, total: R$${total.toFixed(2)}` });
    } catch (err: any) {
      toast({ title: "Erro na exportação", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      key: "bookings" as ReportType,
      icon: Calendar,
      title: "Reservas",
      desc: "Exportar todas as reservas com status, valores e datas.",
      action: exportBookings,
    },
    {
      key: "mesas" as ReportType,
      icon: Users,
      title: "Mesas",
      desc: "Exportar mesas com vagas, sistemas e horários.",
      action: exportMesas,
    },
    {
      key: "revenue" as ReportType,
      icon: DollarSign,
      title: "Receita",
      desc: "Relatório financeiro com total de recebimentos.",
      action: exportRevenue,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-base font-display font-semibold text-foreground">Relatórios & Exportação</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Exporte seus dados em CSV para análise externa ou controle financeiro.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {reports.map((r) => (
          <div
            key={r.key}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                <r.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{r.desc}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={r.action}
              disabled={loading !== null}
            >
              {loading === r.key ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exportando...</>
              ) : (
                <><Download className="h-3.5 w-3.5" /> Exportar CSV</>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
