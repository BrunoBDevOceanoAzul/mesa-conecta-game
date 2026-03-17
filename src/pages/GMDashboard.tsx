import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTables, mockCRMLeads } from "@/data/mock";
import { Crown, Calendar, Users, BarChart3, CreditCard, TrendingUp, Megaphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", path: "/dashboard/mestre", icon: <Crown className="h-4 w-4" /> },
  { label: "Minhas Mesas", path: "/dashboard/mestre", icon: <Calendar className="h-4 w-4" /> },
  { label: "CRM / Leads", path: "/dashboard/mestre", icon: <Users className="h-4 w-4" /> },
  { label: "Analytics", path: "/dashboard/mestre", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Impulsionar", path: "/dashboard/mestre", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <TrendingUp className="h-4 w-4" /> },
];

const myTables = mockTables.filter((t) => t.gmId === "gm1");

const stageColors: Record<string, string> = {
  novo: "bg-secondary/10 text-secondary",
  interessado: "bg-accent/10 text-accent",
  confirmado: "bg-primary/10 text-primary",
  recorrente: "bg-green-500/10 text-green-400",
};

export default function GMDashboard() {
  const [tab, setTab] = useState<"overview" | "crm" | "calc">("overview");

  // Calculator
  const [prepHours, setPrepHours] = useState(2);
  const [sessionHours, setSessionHours] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [platformFee] = useState(15);
  const [players, setPlayers] = useState(4);

  const totalHours = prepHours + sessionHours;
  const baseCost = totalHours * hourlyRate;
  const withFee = baseCost * (1 + platformFee / 100);
  const perPlayer4 = withFee / 4;
  const perPlayer5 = withFee / 5;

  return (
    <DashboardLayout role="gm" navItems={navItems} userName='Rafael "Arkanos"'>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Painel do Mestre 👑</h1>
            <p className="text-muted-foreground mt-1">Gerencie mesas, leads e métricas.</p>
          </div>
          <Button variant="hero" size="sm">+ Nova Mesa</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "overview", label: "Visão Geral" },
            { key: "crm", label: "CRM / Leads" },
            { key: "calc", label: "Calculadora" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Mesas ativas", value: myTables.length.toString(), icon: <Calendar className="h-5 w-5 text-primary" /> },
                { label: "Leads totais", value: mockCRMLeads.length.toString(), icon: <Users className="h-5 w-5 text-secondary" /> },
                { label: "Impressões (7d)", value: "1.2k", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
                { label: "Créditos", value: "45", icon: <CreditCard className="h-5 w-5 text-primary" /> },
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
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Minhas Mesas</h2>
              <div className="space-y-3">
                {myTables.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{t.title}</div>
                      <div className="text-sm text-muted-foreground">{t.system} · {t.seatsAvailable}/{t.seatsTotal} vagas · {new Date(t.startAt).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${t.status === "aberta" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {t.status}
                      </span>
                      <Button variant="outline" size="sm">Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "crm" && (
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Leads e Jogadores</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 text-muted-foreground font-medium">Jogador</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Stage</th>
                    <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Tags</th>
                    <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Notas</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCRMLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {lead.playerName.charAt(0)}
                        </div>
                        <span className="text-foreground">{lead.playerName}</span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${stageColors[lead.stage]}`}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{lead.notes}</td>
                      <td className="p-3 text-muted-foreground text-xs">{lead.sourceTable || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "calc" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Calculadora de Valor Mínimo</h2>
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              {[
                { label: "Horas de preparação", value: prepHours, set: setPrepHours, min: 0, max: 20 },
                { label: "Duração da sessão (h)", value: sessionHours, set: setSessionHours, min: 1, max: 12 },
                { label: "Valor-hora desejado (R$)", value: hourlyRate, set: setHourlyRate, min: 10, max: 200 },
                { label: "Jogadores esperados", value: players, set: setPlayers, min: 2, max: 10 },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-sm text-muted-foreground">{f.label}</label>
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Margem plataforma</span>
                  <span className="text-sm text-foreground">{platformFee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Valor mínimo da sessão</span>
                  <span className="text-lg font-display font-bold text-primary">R${withFee.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Por jogador (4 pessoas)</span>
                  <span className="text-sm font-semibold text-foreground">R${perPlayer4.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Por jogador (5 pessoas)</span>
                  <span className="text-sm font-semibold text-foreground">R${perPlayer5.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
