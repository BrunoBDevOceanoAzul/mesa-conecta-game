import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, XCircle, RefreshCw, Ban, DollarSign, Calendar, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  status: string;
  payment_status: string | null;
  amount: number | null;
  currency: string | null;
  created_at: string;
  canceled_at: string | null;
  player_user_id: string;
  gm_user_id: string;
  game_table_id: string;
  seats_reserved: number | null;
  stripe_checkout_session_id: string | null;
}

export function BookingManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cancelDialog, setCancelDialog] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [issueRefund, setIssueRefund] = useState(true);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as Booking[];
    },
  });

  // Fetch profiles for display
  const playerIds = [...new Set(bookings?.map((b) => b.player_user_id) || [])];
  const gmIds = [...new Set(bookings?.map((b) => b.gm_user_id) || [])];
  const mesaIds = [...new Set(bookings?.map((b) => b.game_table_id) || [])];

  const { data: profiles } = useQuery({
    queryKey: ["admin-booking-profiles", playerIds.join(","), gmIds.join(",")],
    enabled: playerIds.length > 0,
    queryFn: async () => {
      const allIds = [...new Set([...playerIds, ...gmIds])];
      const { data } = await (supabase
        .from("profiles")
        .select("user_id, display_name, name, email") as any)
        .in("user_id", allIds);
      return data || [];
    },
  });

  const { data: mesas } = useQuery({
    queryKey: ["admin-booking-mesas", mesaIds.join(",")],
    enabled: mesaIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase
        .from("mesas")
        .select("id, title") as any)
        .in("id", mesaIds);
      return data || [];
    },
  });

  const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.user_id, p]) || []);
  const mesaMap = new Map<string, any>(mesas?.map((m: any) => [m.id, m]) || []);

  const cancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason, refund }: { bookingId: string; reason: string; refund: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-cancel-booking", {
        body: { booking_id: bookingId, reason, issue_refund: refund },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setCancelDialog(null);
      setCancelReason("");
      const refundMsg = data?.refund
        ? ` Estorno de R$${(data.refund.amount / 100).toFixed(2).replace(".", ",")} processado.`
        : "";
      toast.success(`Reserva cancelada com sucesso.${refundMsg}`);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao cancelar: ${err.message}`);
    },
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      confirmed: { label: "Confirmada", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      canceled: { label: "Cancelada", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const paymentBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Pago", variant: "default" },
      refunded: { label: "Estornado", variant: "destructive" },
      pending: { label: "Pendente", variant: "secondary" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
  };

  const filtered = bookings?.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const player = profileMap.get(b.player_user_id);
    const mesa = mesaMap.get(b.game_table_id);
    return (
      b.id.toLowerCase().includes(q) ||
      player?.name?.toLowerCase().includes(q) ||
      player?.display_name?.toLowerCase().includes(q) ||
      player?.email?.toLowerCase().includes(q) ||
      mesa?.title?.toLowerCase().includes(q)
    );
  });

  // Stats
  const total = bookings?.length || 0;
  const confirmed = bookings?.filter((b) => b.status === "confirmed").length || 0;
  const canceled = bookings?.filter((b) => b.status === "canceled").length || 0;
  const totalRevenue = bookings
    ?.filter((b) => b.payment_status === "paid" && b.status !== "canceled")
    .reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
  const totalRefunded = bookings
    ?.filter((b) => b.payment_status === "refunded")
    .reduce((sum, b) => sum + (b.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-destructive">{canceled}</p>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">
              R${(totalRevenue / 100).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Receita</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">
              R${(totalRefunded / 100).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Estornado</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por jogador, mesa ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bookings list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reservas ({filtered?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !filtered?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((booking) => {
                const player = profileMap.get(booking.player_user_id);
                const gm = profileMap.get(booking.gm_user_id);
                const mesa = mesaMap.get(booking.game_table_id);
                const amountStr = booking.amount
                  ? `R$${(booking.amount / 100).toFixed(2).replace(".", ",")}`
                  : "Gratuita";

                return (
                  <div key={booking.id} className="py-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground truncate">
                          {mesa?.title || "Mesa desconhecida"}
                        </p>
                        {statusBadge(booking.status)}
                        {paymentBadge(booking.payment_status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Jogador: <span className="text-foreground">{player?.display_name || player?.name || "—"}</span>
                        {" · "}Mestre: <span className="text-foreground">{gm?.display_name || gm?.name || "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        {" · "}{amountStr}
                        {booking.seats_reserved && ` · ${booking.seats_reserved} vaga(s)`}
                      </p>
                      {booking.canceled_at && (
                        <p className="text-xs text-destructive">
                          Cancelada em {format(new Date(booking.canceled_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    {booking.status !== "canceled" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCancelDialog(booking);
                          setIssueRefund(!!booking.stripe_checkout_session_id && booking.payment_status === "paid");
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancelar Reserva
            </DialogTitle>
          </DialogHeader>
          {cancelDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-sm font-medium">{mesaMap.get(cancelDialog.game_table_id)?.title || "Mesa"}</p>
                <p className="text-xs text-muted-foreground">
                  Jogador: {profileMap.get(cancelDialog.player_user_id)?.display_name || profileMap.get(cancelDialog.player_user_id)?.name || "—"}
                </p>
                {cancelDialog.amount && (
                  <p className="text-xs text-muted-foreground">
                    Valor: R${(cancelDialog.amount / 100).toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>

              <div>
                <Label>Motivo do cancelamento</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="mt-1"
                />
              </div>

              {cancelDialog.stripe_checkout_session_id && cancelDialog.payment_status === "paid" && (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch checked={issueRefund} onCheckedChange={setIssueRefund} />
                  <div>
                    <Label className="text-sm font-medium">Processar estorno via Stripe</Label>
                    <p className="text-xs text-muted-foreground">
                      O valor de R${((cancelDialog.amount || 0) / 100).toFixed(2).replace(".", ",")} será devolvido ao jogador.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (!cancelDialog) return;
                cancelMutation.mutate({
                  bookingId: cancelDialog.id,
                  reason: cancelReason,
                  refund: issueRefund,
                });
              }}
            >
              {cancelMutation.isPending ? "Processando..." : issueRefund ? "Cancelar e Estornar" : "Cancelar Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
