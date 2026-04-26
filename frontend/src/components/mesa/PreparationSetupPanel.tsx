import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharacterSheetEditor } from "./CharacterSheetEditor";
import { MaterialsEditor } from "./MaterialsEditor";
import { useSystemTemplate, type FormSection, type MaterialItem } from "@/hooks/use-preparation-flow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Save, Loader2, ScrollText, FileText, Link2, Copy,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PreparationSetupPanelProps {
  gameTableId: string;
  systemName: string;
  tableTitle: string;
  onSaved?: () => void;
}

export function PreparationSetupPanel({
  gameTableId, systemName, tableTitle, onSaved,
}: PreparationSetupPanelProps) {
  const { user } = useAuth();
  const { template, loading: templateLoading } = useSystemTemplate(systemName);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [description, setDescription] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingFlowId, setExistingFlowId] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Load existing flow or template defaults
  useEffect(() => {
    if (!gameTableId) return;
    supabase
      .from("table_preparation_flows")
      .select("*")
      .eq("game_table_id", gameTableId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingFlowId(data.id);
          setDescription(data.description || "");
          setDeadlineAt(data.deadline_at ? data.deadline_at.slice(0, 16) : "");
          setShareLink(data.share_link);
          // Load form template
          if (data.form_template_id) {
            supabase
              .from("form_templates")
              .select("schema_json")
              .eq("id", data.form_template_id)
              .single()
              .then(({ data: ft }) => {
              if (ft) setSections((ft.schema_json || []) as unknown as FormSection[]);
              });
          }
          setMaterials((data.materials_json || []) as unknown as MaterialItem[]);
        } else if (template) {
          // Use template defaults
          setSections(template.default_character_form_json);
          setMaterials(template.default_materials_json);
        }
      });
  }, [gameTableId, template]);

  // When template changes and no existing flow, update
  useEffect(() => {
    if (!existingFlowId && template && sections.length === 0) {
      setSections(template.default_character_form_json);
      setMaterials(template.default_materials_json);
    }
  }, [template, existingFlowId]);

  const handleSave = async () => {
    if (!user || !gameTableId) return;
    setSaving(true);

    try {
      // Upsert form template
      let formTemplateId: string | null = null;

      if (sections.length > 0) {
        if (existingFlowId) {
          // Get existing template id
          const { data: flow } = await supabase
            .from("table_preparation_flows")
            .select("form_template_id")
            .eq("id", existingFlowId)
            .single();

          if (flow?.form_template_id) {
            await supabase
              .from("form_templates")
              .update({ schema_json: sections as any })
              .eq("id", flow.form_template_id);
            formTemplateId = flow.form_template_id;
          }
        }

        if (!formTemplateId) {
          const { data: newTemplate } = await supabase
            .from("form_templates")
            .insert({
              template_type: "character_sheet",
              system_template_id: template?.id || null,
              created_by_user_id: user.id,
              name: `Ficha - ${tableTitle}`,
              schema_json: sections as any,
              is_default: false,
              is_public: false,
            })
            .select("id")
            .single();
          formTemplateId = newTemplate?.id || null;
        }
      }

      const generatedShareLink = `${window.location.origin}/mesa/${gameTableId}/ficha`;

      const flowData = {
        game_table_id: gameTableId,
        system_template_id: template?.id || null,
        title: `Preparação - ${tableTitle}`,
        description: description || null,
        form_template_id: formTemplateId,
        materials_json: materials as any,
        share_link: generatedShareLink,
        is_active: true,
        deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      };

      if (existingFlowId) {
        await supabase
          .from("table_preparation_flows")
          .update(flowData)
          .eq("id", existingFlowId);
      } else {
        const { data } = await supabase
          .from("table_preparation_flows")
          .insert(flowData)
          .select("id")
          .single();
        if (data) setExistingFlowId(data.id);
      }

      setShareLink(generatedShareLink);
      toast({ title: "Preparação salva! 📋", description: "Ficha e materiais atualizados com sucesso." });
      onSaved?.();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({ title: "Link copiado! 🔗" });
    }
  };

  if (templateLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando ficha do sistema...</span>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card to-primary/[0.02] overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Preparação da Mesa
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Ficha de personagem, materiais e instruções para jogadores
                </p>
              </div>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-6 border-t border-border/50 pt-4">
            {/* AI badge */}
            {template && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Ficha gerada automaticamente para <strong className="text-foreground">{systemName}</strong>. Edite como quiser.
                </span>
              </div>
            )}

            {/* Description & Deadline */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Instruções para o jogador</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Crie um personagem de nível 3. Escolha apenas raças do cenário."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Prazo para preenchimento</Label>
                <Input
                  type="datetime-local"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                />
              </div>
            </div>

            {/* Character Sheet */}
            <CharacterSheetEditor
              sections={sections}
              onChange={setSections}
              systemName={systemName}
            />

            {/* Materials */}
            <MaterialsEditor
              materials={materials}
              onChange={setMaterials}
            />

            {/* Share Link */}
            {shareLink && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <Link2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{shareLink}</span>
                <Button variant="ghost" size="sm" onClick={copyShareLink} className="h-7 text-xs gap-1">
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </div>
            )}

            {/* Save */}
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Preparação
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
