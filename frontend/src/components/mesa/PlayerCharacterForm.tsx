import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { FormSection } from "@/hooks/use-preparation-flow";
import {
  ScrollText, Save, Send, Loader2, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";

interface PlayerCharacterFormProps {
  gameTableId: string;
  sections: FormSection[];
  submissionId?: string;
  existingAnswers?: Record<string, any>;
  status?: string;
  deadlineAt?: string | null;
  gmInstructions?: string | null;
  onSubmitted?: () => void;
}

export function PlayerCharacterForm({
  gameTableId, sections, submissionId, existingAnswers,
  status: initialStatus, deadlineAt, gmInstructions, onSubmitted,
}: PlayerCharacterFormProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>(existingAnswers || {});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(initialStatus || "not_started");

  useEffect(() => {
    if (existingAnswers) setAnswers(existingAnswers);
  }, [existingAnswers]);

  // Calculate progress
  const allFields = sections.flatMap((s) => s.fields);
  const requiredFields = allFields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => {
    const val = answers[f.id];
    return val !== undefined && val !== null && val !== "";
  });
  const progress = requiredFields.length > 0
    ? Math.round((filledRequired.length / requiredFields.length) * 100)
    : 100;

  const setField = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const upsertSubmission = async (newStatus: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const data: any = {
      game_table_id: gameTableId,
      user_id: user.id,
      answers_json: answers,
      status: newStatus,
      last_edited_at: now,
    };
    if (newStatus === "draft" && status === "not_started") {
      data.started_at = now;
    }
    if (newStatus === "submitted") {
      data.submitted_at = now;
    }

    if (submissionId) {
      await supabase
        .from("player_form_submissions")
        .update(data)
        .eq("id", submissionId);
    } else {
      data.started_at = now;
      await supabase
        .from("player_form_submissions")
        .insert(data);
    }
    setStatus(newStatus);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await upsertSubmission("draft");
      toast({ title: "Rascunho salvo! 📝" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Check required
    const missing = requiredFields.filter((f) => {
      const val = answers[f.id];
      return val === undefined || val === null || val === "";
    });
    if (missing.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missing.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await upsertSubmission("submitted");
      toast({ title: "Ficha enviada! ✅", description: "O mestre receberá sua ficha." });
      onSubmitted?.();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = status === "submitted";
  const isReviewed = status === "reviewed";
  const isPastDeadline = deadlineAt && new Date(deadlineAt) < new Date();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <h3 className="text-base font-display font-semibold text-foreground">
            Ficha de Personagem
          </h3>
        </div>
        <Badge
          variant={isSubmitted || isReviewed ? "default" : status === "draft" ? "secondary" : "outline"}
          className="text-xs gap-1"
        >
          {isSubmitted || isReviewed ? (
            <><CheckCircle2 className="h-3 w-3" /> Enviada</>
          ) : status === "draft" ? (
            <><Clock className="h-3 w-3" /> Rascunho</>
          ) : (
            <><AlertCircle className="h-3 w-3" /> Pendente</>
          )}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* GM Instructions */}
      {gmInstructions && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary mb-1">Instruções do Mestre</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{gmInstructions}</p>
        </div>
      )}

      {/* Deadline */}
      {deadlineAt && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          isPastDeadline ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"
        }`}>
          <Clock className="h-3.5 w-3.5" />
          Prazo: {new Date(deadlineAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
          {isPastDeadline && " (expirado)"}
        </div>
      )}

      {/* Form Sections */}
      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "text" && (
                  <Input
                    value={answers[field.id] || ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={isSubmitted || isReviewed}
                    className="mt-1"
                  />
                )}
                {field.type === "number" && (
                  <Input
                    type="number"
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                    min={field.min}
                    max={field.max}
                    disabled={isSubmitted || isReviewed}
                    className="mt-1"
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    value={answers[field.id] || ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={isSubmitted || isReviewed}
                    className="mt-1 min-h-[60px]"
                  />
                )}
                {field.type === "select" && field.options && (
                  <Select
                    value={answers[field.id] || ""}
                    onValueChange={(v) => setField(field.id, v)}
                    disabled={isSubmitted || isReviewed}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      {!isSubmitted && !isReviewed && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || progress < 100}
            className="flex-1 gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar Ficha
          </Button>
        </div>
      )}

      {(isSubmitted || isReviewed) && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-teal-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-teal-700">
            {isReviewed ? "Ficha revisada pelo Mestre ✅" : "Ficha enviada com sucesso!"}
          </p>
          <p className="text-xs text-teal-600 mt-1">O Mestre verá sua ficha antes da sessão.</p>
        </div>
      )}
    </div>
  );
}
