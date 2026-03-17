import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, Settings, BarChart3 } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
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
            <Shield className="h-6 w-6 text-primary" /> Painel Admin
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a plataforma.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Usuários", value: "—" },
            { label: "Mesas ativas", value: "0" },
            { label: "Mestres", value: "0" },
            { label: "Lojas", value: "0" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Painel admin será expandido conforme a plataforma crescer.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
