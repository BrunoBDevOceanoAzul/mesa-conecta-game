import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertTriangle, Heart, BarChart3, Calendar } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

interface PricingFeedback {
  id: string;
  lead_id: string;
  role_context: string;
  plan_presented: string;
  perceived_price_position: string | null;
  willingness_to_pay_range: string | null;
  preferred_billing_cycle: string | null;
  main_value_drivers: string[];
  main_objections: string[];
  comment: string | null;
}

export function PricingInsights() {
  const [data, setData] = useState<PricingFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("interest_pricing_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: d }) => {
        setData((d as any) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Carregando dados de percepção de valor...</CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">💎 Percepção de Valor</CardTitle></CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Nenhuma resposta de percepção de valor ainda. Os dados aparecerão conforme novos leads respondem o formulário.
        </CardContent>
      </Card>
    );
  }

  const total = data.length;

  // Fairness distribution
  const fairnessCounts: Record<string, number> = {};
  data.forEach((d) => {
    const label = d.perceived_price_position || "sem resposta";
    fairnessCounts[label] = (fairnessCounts[label] || 0) + 1;
  });

  // By role
  const roleCounts: Record<string, number> = {};
  data.forEach((d) => {
    roleCounts[d.role_context] = (roleCounts[d.role_context] || 0) + 1;
  });

  // Price ranges
  const rangeCounts: Record<string, number> = {};
  data.forEach((d) => {
    const r = d.willingness_to_pay_range || "sem resposta";
    rangeCounts[r] = (rangeCounts[r] || 0) + 1;
  });

  // Billing cycle
  const billingCounts: Record<string, number> = {};
  data.forEach((d) => {
    const b = d.preferred_billing_cycle || "sem resposta";
    billingCounts[b] = (billingCounts[b] || 0) + 1;
  });

  // Top value drivers
  const driverCounts: Record<string, number> = {};
  data.forEach((d) => {
    (d.main_value_drivers || []).forEach((v: string) => {
      driverCounts[v] = (driverCounts[v] || 0) + 1;
    });
  });
  const topDrivers = Object.entries(driverCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top objections
  const objectionCounts: Record<string, number> = {};
  data.forEach((d) => {
    (d.main_objections || []).forEach((v: string) => {
      objectionCounts[v] = (objectionCounts[v] || 0) + 1;
    });
  });
  const topObjections = Object.entries(objectionCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Key metrics
  const justCount = fairnessCounts["Justo"] || 0;
  const cheapCount = fairnessCounts["Muito barato"] || 0;
  const expensiveCount = (fairnessCounts["Um pouco caro"] || 0) + (fairnessCounts["Caro demais"] || 0);
  const wouldNotPay = Object.entries(rangeCounts).find(([k]) => k.toLowerCase().includes("não pagaria"));
  const conversionPotential = total > 0 ? Math.round(((justCount + cheapCount) / total) * 100) : 0;

  const fairnessColor: Record<string, string> = {
    "Muito barato": "bg-success/20 text-success",
    "Justo": "bg-primary/20 text-primary",
    "Um pouco caro": "bg-warning/20 text-warning",
    "Caro demais": "bg-destructive/20 text-destructive",
    "Não entendi valor suficiente ainda": "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 mb-1">💎 Percepção de Valor</h2>
        <p className="text-body-sm text-muted-foreground">Dados de pricing perception coletados no formulário de interesse.</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Respostas de pricing" value={String(total)} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Percebem como justo" value={`${justCount}`} accent />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Percebem como caro" value={`${expensiveCount}`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Potencial de conversão" value={`${conversionPotential}%`} accent />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fairness distribution */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Preço percebido</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(fairnessCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <Badge className={`text-xs ${fairnessColor[label] || "bg-muted text-muted-foreground"} border-0`}>
                  {label}
                </Badge>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Faixa ideal */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Faixa de valor aceita</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(rangeCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top value drivers */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Entregas mais valorizadas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topDrivers.map(([driver, count], i) => (
              <div key={driver} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{i + 1}. {driver}</span>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
            {topDrivers.length === 0 && <p className="text-caption text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>

        {/* Top objections */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Principais objeções</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topObjections.map(([obj, count], i) => (
              <div key={obj} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{i + 1}. {obj}</span>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
            {topObjections.length === 0 && <p className="text-caption text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>

        {/* Billing preference */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-4 w-4" /> Preferência de cobrança</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(billingCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By role */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Por perfil</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{role}</Badge>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
