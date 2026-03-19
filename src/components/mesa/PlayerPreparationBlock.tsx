import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerCharacterForm } from "./PlayerCharacterForm";
import { MaterialsEditor } from "./MaterialsEditor";
import type { FormSection, MaterialItem } from "@/hooks/use-preparation-flow";
import {
  ScrollText, FileText, ChevronRight, CheckCircle2, Clock, AlertCircle,
  BookOpen, Loader2,
} from "lucide-react";

interface PlayerPreparationBlockProps {
  gameTableId: string;
  tableTitle: string;
  systemName: string;
}

type View = "overview" | "form" | "materials";

export function PlayerPreparationBlock({
  gameTableId, tableTitle, systemName,
}: PlayerPreparationBlockProps) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [description, setDescription] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [hasFlow, setHasFlow] = useState(false);

  useEffect(() => {
    if (!gameTableId || !user) return;
    setLoading(true);

    // Load preparation flow
    supabase
      .from("table_preparation_flows")
      .select("*")
      .eq("game_table_id", gameTableId)
      .eq("is_active", true)
      .maybeSingle()
      .then(async ({ data: flow }) => {
        if (!flow) { setLoading(false); return; }
        setHasFlow(true);
        setDescription(flow.description);
        setDeadlineAt(flow.deadline_at);
        setMaterials((flow.materials_json || []) as unknown as MaterialItem[]);

        // Load form template
        if (flow.form_template_id) {
          const { data: ft } = await supabase
            .from("form_templates")
            .select("schema_json")
            .eq("id", flow.form_template_id)
            .single();
          if (ft) setSections((ft.schema_json || []) as FormSection[]);
        }

        // Load player submission
        const { data: sub } = await supabase
          .from("player_form_submissions")
          .select("*")
          .eq("game_table_id", gameTableId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (sub) setSubmission(sub);

        // Track material access
        const { data: access } = await supabase
          .from("player_material_access")
          .select("id")
          .eq("game_table_id", gameTableId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!access) {
          await supabase.from("player_material_access").insert({
            game_table_id: gameTableId,
            user_id: user.id,
          });
        }

        setLoading(false);
      });
  }, [gameTableId, user]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando preparação...</span>
      </div>
    );
  }

  if (!hasFlow) return null;

  const formStatus = submission?.status || "not_started";
  const statusConfig = {
    not_started: { label: "Pendente", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
    draft: { label: "Rascunho", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
    submitted: { label: "Enviada", icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-50" },
    reviewed: { label: "Revisada", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5" },
  }[formStatus] || { label: "Pendente", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" };

  const StatusIcon = statusConfig.icon;

  if (view === "form") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView("overview")} className="text-xs gap-1">
          ← Voltar
        </Button>
        <PlayerCharacterForm
          gameTableId={gameTableId}
          sections={sections}
          submissionId={submission?.id}
          existingAnswers={submission?.answers_json || {}}
          status={formStatus}
          deadlineAt={deadlineAt}
          gmInstructions={description}
          onSubmitted={() => {
            setSubmission({ ...submission, status: "submitted" });
            setView("overview");
          }}
        />
      </div>
    );
  }

  if (view === "materials") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView("overview")} className="text-xs gap-1">
          ← Voltar
        </Button>
        <MaterialsEditor materials={materials} onChange={() => {}} readOnly />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-card to-primary/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-semibold text-foreground">
            Preparação da Mesa
          </h3>
          <p className="text-[11px] text-muted-foreground truncate">
            {tableTitle} · {systemName}
          </p>
        </div>
      </div>

      {/* GM Instructions */}
      {description && (
        <div className="rounded-lg bg-muted/30 border border-border p-3">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Character Sheet */}
        {sections.length > 0 && (
          <button
            onClick={() => setView("form")}
            className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Ficha de Personagem</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className={`flex items-center gap-1.5 ${statusConfig.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{statusConfig.label}</span>
            </div>
          </button>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <button
            onClick={() => setView("materials")}
            className="rounded-xl border border-border bg-card p-4 text-left hover:border-secondary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">Materiais</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </div>
            <span className="text-xs text-muted-foreground">
              {materials.length} {materials.length === 1 ? "material" : "materiais"} disponíveis
            </span>
          </button>
        )}
      </div>

      {/* Deadline */}
      {deadlineAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Prazo: {new Date(deadlineAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
