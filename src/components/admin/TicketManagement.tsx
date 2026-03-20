import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, RefreshCw, LifeBuoy, MessageSquare, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  aberto: { label: "Aberto", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: <Clock className="h-3.5 w-3.5" /> },
  resolvido: { label: "Resolvido", className: "bg-green-500/15 text-green-600 border-green-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  fechado: { label: "Fechado", className: "bg-muted text-muted-foreground border-border", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  exclusao_mesa: "Exclusão de Mesa",
  financeiro: "Financeiro",
  conta: "Conta",
  bug: "Bug",
  sugestao: "Sugestão",
};

export function TicketManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status,
          admin_notes: notes || null,
          resolved_by: status === "resolvido" || status === "fechado" ? user?.id : null,
          resolved_at: status === "resolvido" || status === "fechado" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      setSelected(null);
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const filtered = tickets.filter((t: any) => {
    const matchesSearch =
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: tickets.length,
    aberto: tickets.filter((t: any) => t.status === "aberto").length,
    em_andamento: tickets.filter((t: any) => t.status === "em_andamento").length,
    resolvido: tickets.filter((t: any) => t.status === "resolvido" || t.status === "fechado").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Total Tickets</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-display font-bold text-foreground">{counts.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Abertos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-display font-bold text-yellow-600">{counts.aberto}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Em Andamento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-display font-bold text-blue-600">{counts.em_andamento}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Resolvidos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-display font-bold text-green-600">{counts.resolvido}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assunto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ticket: any) => {
                  const s = statusMap[ticket.status] || statusMap.aberto;
                  return (
                    <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[250px] truncate">{ticket.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{CATEGORY_LABELS[ticket.category] || ticket.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={s.className}>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {format(new Date(ticket.created_at), "dd MMM yy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(ticket);
                            setAdminNotes(ticket.admin_notes || "");
                            setNewStatus(ticket.status);
                          }}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Responder
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum ticket encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Respond Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" /> Ticket: {selected?.subject}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Descrição do usuário:</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selected?.description}</p>
            </div>

            {selected?.related_entity_type && (
              <div className="text-xs text-muted-foreground">
                Referência: {selected.related_entity_type} — <code className="text-[10px]">{selected.related_entity_id}</code>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Resposta / Notas do Admin</label>
              <Textarea
                className="mt-1.5"
                placeholder="Escreva a resposta ao usuário..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (selected) updateMutation.mutate({ id: selected.id, status: newStatus, notes: adminNotes });
              }}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
