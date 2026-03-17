import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, Settings, BarChart3 } from "lucide-react";

const navItems = [
  { label: "Painel", path: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Usuários", path: "/admin", icon: <Users className="h-4 w-4" /> },
  { label: "Configurações", path: "/admin", icon: <Settings className="h-4 w-4" /> },
];

export default function Admin() {
  const { user } = useAuth();

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Admin"}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Centro de Operações
          </h1>
          <p className="text-muted-foreground mt-1">Gestão centralizada da plataforma HIVIUM.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Membros", value: "—", icon: <Users className="h-5 w-5 text-primary" /> },
            { label: "Mesas ativas", value: "0", icon: <BarChart3 className="h-5 w-5 text-secondary" /> },
            { label: "Mestres", value: "0", icon: <Shield className="h-5 w-5 text-primary" /> },
            { label: "Luderias", value: "0", icon: <Settings className="h-5 w-5 text-secondary" /> },
          ].map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <div className="text-2xl font-display font-bold text-foreground mt-2">{s.value}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {s.icon}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/40 to-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">Em construção</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">O centro operacional HIVIUM será expandido conforme a plataforma crescer. Gestão de usuários, moderação e analytics em breve.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
