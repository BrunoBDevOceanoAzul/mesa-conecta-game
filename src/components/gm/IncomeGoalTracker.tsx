import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Zap, Calendar, Trophy, ChevronRight } from "lucide-react";

interface IncomeGoal {
  id: string;
  goal_amount: number;
  amount_achieved: number;
  progress_percent: number;
  status: string;
  started_at: string;
  ends_at: string;
}

export function IncomeGoalTracker() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<IncomeGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newAmount, setNewAmount] = useState(2000);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("income_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const g = data[0] as any;
          setGoal({
            id: g.id,
            goal_amount: Number(g.goal_amount),
            amount_achieved: Number(g.amount_achieved),
            progress_percent: Number(g.progress_percent),
            status: g.status,
            started_at: g.started_at,
            ends_at: g.ends_at,
          });
          setNewAmount(Number(g.goal_amount));
        }
        setLoading(false);
      });
  }, [user]);

  const createGoal = async () => {
    if (!user || newAmount <= 0) return;
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const { data, error } = await supabase.from("income_goals").insert({
      user_id: user.id,
      goal_amount: newAmount,
      goal_period_type: "monthly",
      ends_at: endOfMonth.toISOString(),
    }).select().single();

    if (data) {
      setGoal({
        id: data.id,
        goal_amount: Number(data.goal_amount),
        amount_achieved: Number(data.amount_achieved),
        progress_percent: Number(data.progress_percent),
        status: data.status,
        started_at: data.started_at,
        ends_at: data.ends_at,
      });
      setEditMode(false);
    }
  };

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
  }

  if (!goal && !editMode) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-card/50 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-display font-semibold text-foreground">Defina sua meta mensal</h3>
          <p className="text-xs text-muted-foreground mt-1">Acompanhe seu progresso financeiro e ganhe XP ao atingir marcos.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setEditMode(true)}>
          Criar Meta
        </Button>
      </div>
    );
  }

  if (editMode && !goal) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-display font-semibold text-foreground">Nova Meta Mensal</h3>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Valor da meta</label>
          <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
            <span className="pl-3 text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
              min={100}
              max={50000}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" size="sm" onClick={createGoal}>Confirmar</Button>
          <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  if (!goal) return null;

  const progress = Math.min(goal.progress_percent, 100);
  const remaining = Math.max(goal.goal_amount - goal.amount_achieved, 0);
  const endDate = new Date(goal.ends_at);
  const daysLeft = Math.max(Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0);

  // Milestones
  const milestones = [
    { pct: 25, label: "25%", xp: 15, reached: progress >= 25 },
    { pct: 50, label: "50%", xp: 30, reached: progress >= 50 },
    { pct: 75, label: "75%", xp: 50, reached: progress >= 75 },
    { pct: 100, label: "100%", xp: 100, reached: progress >= 100 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Meta do Mês
          </h3>
          <Badge variant={progress >= 100 ? "premium" : progress >= 50 ? "default" : "secondary"}>
            {progress.toFixed(0)}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R${goal.amount_achieved.toFixed(0)} alcançado</span>
            <span>Meta: R${goal.goal_amount.toFixed(0)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">R${remaining.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Faltam</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">{daysLeft}</p>
            <p className="text-[10px] text-muted-foreground">Dias restantes</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">
              {daysLeft > 0 ? `R$${(remaining / daysLeft).toFixed(0)}` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Meta/dia</p>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Marcos de XP</h4>
          <div className="flex gap-2">
            {milestones.map((m) => (
              <div
                key={m.pct}
                className={`flex-1 rounded-lg border p-2 text-center transition-all ${
                  m.reached
                    ? "border-primary/30 bg-primary/10"
                    : "border-border bg-muted/20"
                }`}
              >
                <p className={`text-xs font-bold ${m.reached ? "text-primary" : "text-muted-foreground"}`}>
                  {m.label}
                </p>
                <p className="text-[9px] text-muted-foreground">+{m.xp} XP</p>
              </div>
            ))}
          </div>
        </div>

        {progress >= 100 && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3">
            <Trophy className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm font-medium text-success">Meta atingida! 🏆</p>
              <p className="text-[11px] text-success/80">+100 XP e badge "Meta Cumprida" desbloqueada.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
