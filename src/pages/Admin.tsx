import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTables, mockGMs } from "@/data/mock";
import { Shield, Users, Settings, BarChart3, Eye } from "lucide-react";

const navItems = [
  { label: "Visão Geral", path: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Usuários", path: "/admin", icon: <Users className="h-4 w-4" /> },
  { label: "Mesas", path: "/admin", icon: <Eye className="h-4 w-4" /> },
  { label: "Configurações", path: "/admin", icon: <Settings className="h-4 w-4" /> },
];

export default function Admin() {
  return (
    <DashboardLayout role="player" navItems={navItems} userName="Admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Painel Admin</h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Usuários", value: "1.247" },
            { label: "Mesas ativas", value: mockTables.length.toString() },
            { label: "Mestres", value: mockGMs.length.toString() },
            { label: "CPC base", value: "R$0,50" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Usuários Recentes</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Perfil</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Cidade</th>
              </tr></thead>
              <tbody>
                {mockGMs.map((gm) => (
                  <tr key={gm.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-3 text-foreground">{gm.name}</td>
                    <td className="p-3"><span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Mestre</span></td>
                    <td className="p-3 text-muted-foreground">{gm.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
