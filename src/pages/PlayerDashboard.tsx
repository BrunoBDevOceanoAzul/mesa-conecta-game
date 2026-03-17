import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTables } from "@/data/mock";
import { TableCard } from "@/components/shared/TableCard";
import { NearbyStoresMap } from "@/components/shared/NearbyStoresMap";
import { Search, Calendar, MapPin, Gamepad2, BarChart3, Heart } from "lucide-react";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Buscar Mesas", path: "/buscar", icon: <Search className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/dashboard/jogador", icon: <Calendar className="h-4 w-4" /> },
  { label: "Favoritos", path: "/dashboard/jogador", icon: <Heart className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <BarChart3 className="h-4 w-4" /> },
];

const topMatches = mockTables.filter((t) => t.matchScore >= 85).slice(0, 3);
const upcoming = mockTables.slice(0, 2);

export default function PlayerDashboard() {
  return (
    <DashboardLayout role="player" navItems={navItems} userName="Jogador Demo">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Olá, Aventureiro! 🎲</h1>
          <p className="text-muted-foreground mt-1">Aqui estão suas melhores recomendações de hoje.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Mesas recomendadas", value: "6", icon: <MapPin className="h-5 w-5 text-primary" /> },
            { label: "Próximas sessões", value: "2", icon: <Calendar className="h-5 w-5 text-secondary" /> },
            { label: "Match médio", value: "87%", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50">{s.icon}</div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top matches */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">🎯 Melhores matches para você</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topMatches.map((t) => (
              <TableCard key={t.id} table={t} />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">📅 Próximas sessões</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{t.title}</div>
                  <div className="text-sm text-muted-foreground">{t.system} · {new Date(t.startAt).toLocaleDateString("pt-BR")}</div>
                </div>
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Confirmado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
