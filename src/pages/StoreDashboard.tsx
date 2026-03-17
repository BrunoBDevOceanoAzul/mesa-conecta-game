import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTables } from "@/data/mock";
import { Store, Calendar, BarChart3, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", path: "/dashboard/loja", icon: <Store className="h-4 w-4" /> },
  { label: "Agenda", path: "/dashboard/loja", icon: <Calendar className="h-4 w-4" /> },
  { label: "Analytics", path: "/dashboard/loja", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Configurações", path: "/dashboard/loja", icon: <Settings className="h-4 w-4" /> },
];

const storeTables = mockTables.filter((t) => t.venue.includes("Taverna") || t.venue.includes("Dungeon"));

export default function StoreDashboard() {
  return (
    <DashboardLayout role="store" navItems={navItems} userName="Taverna do Dragão">
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
            { label: "Mesas este mês", value: "8", icon: <Calendar className="h-5 w-5 text-primary" /> },
            { label: "Capacidade usada", value: "72%", icon: <Store className="h-5 w-5 text-secondary" /> },
            { label: "Reservas (7d)", value: "23", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
            { label: "Visualizações", value: "456", icon: <TrendingUp className="h-5 w-5 text-primary" /> },
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
          <div className="space-y-3">
            {storeTables.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{t.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.system} · {t.gmName} · {new Date(t.startAt).toLocaleDateString("pt-BR")} · {t.seatsAvailable}/{t.seatsTotal} vagas
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${t.status === "aberta" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Informações da Luderia</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Endereço:</span> <span className="text-foreground ml-2">R. Augusta, 1200 – São Paulo</span></div>
            <div><span className="text-muted-foreground">Capacidade:</span> <span className="text-foreground ml-2">40 pessoas</span></div>
            <div><span className="text-muted-foreground">Mesas simultâneas:</span> <span className="text-foreground ml-2">8</span></div>
            <div><span className="text-muted-foreground">Plano:</span> <span className="text-primary font-medium ml-2">Loja Growth</span></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
