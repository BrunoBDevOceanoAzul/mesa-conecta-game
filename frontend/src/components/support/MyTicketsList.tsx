import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Plus } from "lucide-react";
import { useState } from "react";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; className: string }> = {
  aberto: { label: "Aberto", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20" },
  em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  resolvido: { label: "Resolvido", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  fechado: { label: "Fechado", className: "bg-muted text-muted-foreground border-border" },
};

export function MyTicketsList() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const { data: tickets = [], refetch } = useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" /> Meus Tickets
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <LifeBuoy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum ticket aberto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => {
            const s = statusMap[t.status] || statusMap.aberto;
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(t.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="outline" className={s.className}>{s.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                {t.admin_notes && (
                  <div className="rounded-lg bg-muted/50 p-3 mt-1">
                    <p className="text-xs font-medium text-foreground">Resposta da equipe:</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.admin_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateTicketDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => refetch()}
      />
    </div>
  );
}
