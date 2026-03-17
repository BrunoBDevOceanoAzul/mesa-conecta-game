import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Store, Calendar, BarChart3, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", path: "/dashboard/loja", icon: <Store className="h-4 w-4" /> },
  { label: "Agenda", path: "/dashboard/loja", icon: <Calendar className="h-4 w-4" /> },
  { label: "Analytics", path: "/dashboard/loja", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Configurações", path: "/dashboard/loja", icon: <Settings className="h-4 w-4" /> },
];

export default function StoreDashboard() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.name || "Luderia";

  return (
    <DashboardLayout role="store" navItems={navItems} userName={displayName}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Painel da Luderia 🏠</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua agenda, mesas e visibilidade.</p>
          </div>
          <Button variant="hero" size="sm">+ Publicar Agenda</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Mesas este mês", value: "0", icon: <Calendar className="h-5 w-5 text-primary" /> },
            { label: "Capacidade usada", value: "—", icon: <Store className="h-5 w-5 text-secondary" /> },
            { label: "Reservas (7d)", value: "0", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
            { label: "Visualizações", value: "0", icon: <TrendingUp className="h-5 w-5 text-primary" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">{s.icon}</div>
              <div>
                <div className="text-xl font-display font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Agenda de Mesas</h2>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma mesa agendada. Publique sua primeira agenda!</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Informações da Luderia</h2>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
            <Store className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Complete o perfil da sua luderia para aparecer no mapa.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
