import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PlayerCharacterForm } from "@/components/mesa/PlayerCharacterForm";
import { PremiumCharacterSheet } from "@/components/sheet/PremiumCharacterSheet";
import { getSheetTemplate } from "@/data/sheet-templates";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { FormSection } from "@/hooks/use-preparation-flow";
import { Loader2, ScrollText, ArrowLeft } from "lucide-react";

export default function MesaCharacterSheet() {
  const { query } = useRouter();
  const id = query.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [mesa, setMesa] = useState<{ title: string; system: string } | null>(null);
  const [flow, setFlow] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  // Premium sheet state
  const [premiumValues, setPremiumValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const load = async () => {
      const { data: mesaData } = await supabase
        .from("game_tables")
        .select("title, system_name")
        .eq("id", id)
        .single();

      if (mesaData) {
        setMesa({ title: mesaData.title, system: mesaData.system_name });
      }

      const { data: flowData } = await supabase
        .from("table_preparation_flows")
        .select("*")
        .eq("game_table_id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (flowData) {
        setFlow(flowData);

        if (flowData.form_template_id) {
          const { data: ft } = await supabase
            .from("form_templates")
            .select("schema_json")
            .eq("id", flowData.form_template_id)
            .single();
          if (ft) setSections((ft.schema_json || []) as unknown as FormSection[]);
        }

        if (user) {
          const { data: sub } = await supabase
            .from("player_form_submissions")
            .select("*")
            .eq("game_table_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          setSubmission(sub);
          if (sub?.answers_json) {
            setPremiumValues(sub.answers_json as Record<string, any>);
          }
        }
      }

      setLoading(false);
    };

    load();
  }, [id, user]);

  // Check if this system has a premium themed template
  const premiumTemplate = mesa ? getSheetTemplate(mesa.system) : null;

  const upsertSubmission = async (newStatus: string) => {
    if (!user || !id) return;
    const now = new Date().toISOString();
    const data: any = {
      game_table_id: id,
      user_id: user.id,
      answers_json: premiumValues,
      status: newStatus,
      last_edited_at: now,
    };
    if (newStatus === "draft" && (!submission || submission.status === "not_started")) {
      data.started_at = now;
    }
    if (newStatus === "submitted") {
      data.submitted_at = now;
    }

    if (submission?.id) {
      await supabase.from("player_form_submissions").update(data).eq("id", submission.id);
    } else {
      data.started_at = now;
      const { data: inserted } = await supabase.from("player_form_submissions").insert(data).select().single();
      if (inserted) setSubmission(inserted);
    }
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
    setSubmitting(true);
    try {
      await upsertSubmission("submitted");
      toast({ title: "Ficha enviada! ✅", description: "O mestre receberá sua ficha." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {mesa && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground">
                Ficha de Personagem
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {mesa.title} · {mesa.system}
            </p>
          </div>
        )}

        {/* Use premium themed sheet when available, fall back to classic form */}
        {premiumTemplate ? (
          <PremiumCharacterSheet
            systemName={mesa?.system}
            values={premiumValues}
            onChange={setPremiumValues}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            saving={saving}
            submitting={submitting}
            status={submission?.status || "not_started"}
            deadlineAt={flow?.deadline_at}
            gmInstructions={flow?.description}
          />
        ) : sections.length > 0 ? (
          <PlayerCharacterForm
            gameTableId={id!}
            sections={sections}
            submissionId={submission?.id}
            existingAnswers={submission?.answers_json || {}}
            status={submission?.status || "not_started"}
            deadlineAt={flow?.deadline_at}
            gmInstructions={flow?.description}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhuma ficha disponível para esta mesa.
            </p>
            {!user && (
              <Button variant="hero" size="sm" className="mt-4" onClick={() => router.push("/login")}>
                Fazer login
              </Button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
