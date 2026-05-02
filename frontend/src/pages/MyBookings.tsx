import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi } from "@/lib/api";
import { Calendar, Gamepad2, Compass, Heart, CreditCard, BarChart3, Loader2, MapPin, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <Compass className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/minhas-reservas", icon: <Calendar className="h-4 w-4" /> },
  { label: "Assinatura", path: "/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Favoritos", path: "/favoritos", icon: <Heart className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <BarChart3 className="h-4 w-4" /> },
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  confirmed: { label: "Confirmada", icon: <CheckCircle2 className="h-3.5 w-3.5" />, class: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", icon: <Clock className="h-3.5 w-3.5" />, class: "bg-warning/10 text-warning border-warning/20" },
  canceled: { label: "Cancelada", icon: <XCircle className="h-3.5 w-3.5" />, class: "bg-destructive/10 text-destructive border-destructive/20" },
  completed: { label: "Concluída", icon: <CheckCircle2 className="h-3.5 w-3.5" />, class: "bg-muted text-muted-foreground border-border" },
};

export default function MyBookings() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    bookingsApi
      .listMine()
      .then(({ data }) => { setBookings(data || []); setLoading(false); })
      .catch(() => { setBookings([]); setLoading(false); });
  }, [user]);

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Jogador"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-foreground flex items-center gap-2"><Calendar className="h-6 w-6 text-primary" /> Minhas Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico e próximas sessões</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Você ainda não tem reservas</p>
            <Button onClick={() => router.push("/explorar")} className="gap-1.5">
              <Compass className="h-4 w-4" /> Explorar Mesas
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const mesa = b.mesas;
              const st = statusConfig[b.status || "pending"] || statusConfig.pending;
              return (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  {mesa?.image_url && (
                    <img src={mesa.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{mesa?.title || "Mesa"}</p>
                    <p className="text-xs text-muted-foreground">{mesa?.system} · {mesa?.city || "Online"}</p>
                    {mesa?.start_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(mesa.start_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${st.class} gap-1 shrink-0`}>
                    {st.icon} {st.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push(`/mesa/${b.game_table_id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
