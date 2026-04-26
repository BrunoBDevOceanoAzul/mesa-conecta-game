import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAvailability } from "@/hooks/use-availability";
import { WeeklyScheduleView } from "@/components/schedule/WeeklyScheduleView";
import { ExceptionsList } from "@/components/schedule/ExceptionsList";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { AddTimeBlockDialog } from "@/components/schedule/AddTimeBlockDialog";
import { AddExceptionDialog } from "@/components/schedule/AddExceptionDialog";
import { CopyRuleDialog } from "@/components/schedule/CopyRuleDialog";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, CalendarOff, Plus, List, LayoutGrid, Clock } from "lucide-react";
import { Navigate } from "react-router-dom";

type ViewMode = "weekly" | "list";

const GM_NAV = [
  { label: "Painel", path: "/dashboard/mestre", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Agenda", path: "/agenda", icon: <Clock className="h-4 w-4" /> },
];

const STORE_NAV = [
  { label: "Painel", path: "/dashboard/loja", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Agenda", path: "/agenda", icon: <Clock className="h-4 w-4" /> },
];

export default function Agenda() {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<"gm" | "store" | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const r = data?.role;
        if (r === "gm" || r === "store") setUserRole(r);
        setRoleLoading(false);
      });
  }, [user]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!userRole) return <Navigate to="/" replace />;

  return <AgendaContent role={userRole} />;
}

function AgendaContent({ role }: { role: "gm" | "store" }) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.name || (role === "gm" ? "Mestre" : "Luderia");
  const {
    rulesByDay, futureExceptions, loading, saving,
    addRule, updateRule, deleteRule, addException, deleteException, copyRuleToDays,
  } = useAvailability(role);

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [addBlockDay, setAddBlockDay] = useState(1);
  const [addExcOpen, setAddExcOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyingRuleId, setCopyingRuleId] = useState<string | null>(null);
  const [copyingRuleDay, setCopyingRuleDay] = useState<number | undefined>();

  const handleAddBlock = (day: number) => {
    setAddBlockDay(day);
    setAddBlockOpen(true);
  };

  const handleSaveBlock = async (data: any) => {
    const ok = await addRule(data);
    if (ok) setAddBlockOpen(false);
  };

  const handleSaveException = async (data: any) => {
    const ok = await addException(data);
    if (ok) setAddExcOpen(false);
  };

  const handleCopyRule = (ruleId: string) => {
    const rule = Object.values(rulesByDay).flat().find((r) => r.id === ruleId);
    setCopyingRuleId(ruleId);
    setCopyingRuleDay(rule?.day_of_week ?? undefined);
    setCopyDialogOpen(true);
  };

  const handleConfirmCopy = async (targetDays: number[]) => {
    if (copyingRuleId) {
      await copyRuleToDays(copyingRuleId, targetDays);
    }
    setCopyDialogOpen(false);
    setCopyingRuleId(null);
  };

  const navItems = role === "gm" ? GM_NAV : STORE_NAV;

  return (
    <DashboardLayout role={role} navItems={navItems} userName={displayName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Agenda Recorrente
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "gm"
                ? "Defina seus horários recorrentes para facilitar a criação de mesas."
                : "Organize os horários de operação da sua luderia."}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setAddExcOpen(true)}
            >
              <CalendarOff className="h-3.5 w-3.5" /> Exceção
            </Button>
            <Button
              variant="hero"
              size="sm"
              className="gap-1"
              onClick={() => handleAddBlock(1)}
            >
              <Plus className="h-4 w-4" /> Horário
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <ScheduleSummary rulesByDay={rulesByDay} futureExceptions={futureExceptions} />

            {/* View toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-foreground">
                Disponibilidade semanal
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setViewMode("weekly")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "weekly" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Schedule view */}
            <WeeklyScheduleView
              rulesByDay={rulesByDay}
              onAddBlock={handleAddBlock}
              onDeleteRule={deleteRule}
              onToggleRule={(id, active) => updateRule(id, { is_active: active })}
              onCopyRule={handleCopyRule}
              role={role}
            />

            {/* Exceptions section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-display font-semibold text-foreground">
                  Exceções & Bloqueios
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setAddExcOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              <ExceptionsList exceptions={futureExceptions} onDelete={deleteException} />
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddTimeBlockDialog
        open={addBlockOpen}
        onClose={() => setAddBlockOpen(false)}
        onSave={handleSaveBlock}
        initialDay={addBlockDay}
        role={role}
        saving={saving}
      />
      <AddExceptionDialog
        open={addExcOpen}
        onClose={() => setAddExcOpen(false)}
        onSave={handleSaveException}
        saving={saving}
      />
      <CopyRuleDialog
        open={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        onConfirm={handleConfirmCopy}
        excludeDay={copyingRuleDay}
        saving={saving}
      />
    </DashboardLayout>
  );
}
