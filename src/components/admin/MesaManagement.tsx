import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search, Trash2, Calendar, Users, DollarSign,
  MapPin, Gamepad2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mesa {
  id: string;
  title: string;
  system: string;
  format: string;
  city: string | null;
  status: string;
  seats_total: number;
  seats_available: number;
  min_price: number | null;
  max_price: number | null;
  gm_name: string | null;
  gm_id: string;
  start_at: string;
  created_at: string;
}

export function MesaManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Mesa | null>(null);
  const [reason, setReason] = useState("");

  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ["admin-mesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Mesa[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mesa: Mesa) => {
      // Log admin action first
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_actions").insert({
          admin_user_id: user.id,
          action_type: "delete_mesa",
          target_type: "mesa",
          target_id: mesa.id,
          notes: reason || `Mesa "${mesa.title}" deletada pelo admin`,
        });
      }
      const { error } = await supabase.from("mesas").delete().eq("id", mesa.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mesa deletada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin-mesas"] });
      setDeleteTarget(null);
      setReason("");
    },
    onError: (err: any) => {
      toast.error("Erro ao deletar mesa: " + err.message);
    },
  });

  const filtered = mesas.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.gm_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.system || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    aberta: "bg-green-500/15 text-green-600 border-green-500/20",
    fechada: "bg-muted text-muted-foreground border-border",
    cancelada: "bg-destructive/15 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Total Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold text-foreground">{mesas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold text-green-600">
              {mesas.filter((m) => m.status === "aberta").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Vagas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold text-foreground">
              {mesas.reduce((s, m) => s + m.seats_total, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Ocupação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold text-foreground">
              {mesas.length > 0
                ? Math.round(
                    (mesas.reduce((s, m) => s + (m.seats_total - m.seats_available), 0) /
                      mesas.reduce((s, m) => s + m.seats_total, 0)) *
                      100
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, mestre ou sistema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-mesas"] })}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mesa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Mestre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Sistema</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Vagas</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Preço</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((mesa) => (
                  <tr key={mesa.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                      {mesa.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {mesa.gm_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {mesa.system}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {format(new Date(mesa.start_at), "dd MMM yy", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={statusColor[mesa.status] || ""}
                      >
                        {mesa.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {mesa.seats_total - mesa.seats_available}/{mesa.seats_total}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      R${mesa.min_price || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(mesa)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma mesa encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Deletar Mesa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar permanentemente a mesa{" "}
              <strong>"{deleteTarget?.title}"</strong>. Esta ação não pode ser desfeita.
              Reservas existentes não serão canceladas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Motivo (opcional)</label>
            <Textarea
              placeholder="Ex: mesa duplicada, conteúdo inadequado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
              }}
            >
              {deleteMutation.isPending ? "Deletando..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
