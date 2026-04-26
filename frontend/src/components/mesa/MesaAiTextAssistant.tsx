import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Wand2, Tag, Type, FileText, Loader2, Check, RotateCcw, ChevronDown, ChevronUp
} from "lucide-react";

interface MesaAiTextAssistantProps {
  title: string;
  description: string;
  system: string;
  sessionType: string;
  format: string;
  tags?: string[];
  onApplyTitle?: (title: string) => void;
  onApplyDescription?: (description: string) => void;
  onApplyTags?: (tags: string[]) => void;
}

type AiAction = "improve_description" | "improve_title" | "suggest_tags" | "generate_cover_prompt";

export function MesaAiTextAssistant({
  title, description, system, sessionType, format, tags,
  onApplyTitle, onApplyDescription, onApplyTags,
}: MesaAiTextAssistantProps) {
  const [loading, setLoading] = useState<AiAction | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Results
  const [descriptionResults, setDescriptionResults] = useState<{
    improved: string; short: string; seo: string;
  } | null>(null);
  const [titleResults, setTitleResults] = useState<{
    title: string; reason: string;
  }[] | null>(null);
  const [tagResults, setTagResults] = useState<{
    tags: string[]; keywords: string[]; meta_description: string;
  } | null>(null);

  const [selectedDescVersion, setSelectedDescVersion] = useState<"improved" | "short" | "seo">("improved");

  const callAi = async (action: AiAction) => {
    if (!title && !description) {
      toast({ title: "Preencha pelo menos o título ou a descrição", variant: "destructive" });
      return;
    }
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("mesa-ai-assist", {
        body: { action, title, description, system, session_type: sessionType, format, tags },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      switch (action) {
        case "improve_description":
          setDescriptionResults(data.result);
          break;
        case "improve_title":
          setTitleResults(data.result.suggestions);
          break;
        case "suggest_tags":
          setTagResults(data.result);
          break;
      }
    } catch (err: any) {
      toast({ title: "Erro ao usar IA", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const hasContent = title || description;

  return (
    <div className="rounded-xl border border-plum-200 bg-gradient-to-br from-plum-50/50 to-gold-50/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-plum-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-plum-500 to-gold-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">Assistente IA</span>
            <span className="text-[11px] text-muted-foreground">Melhore título, descrição e tags com IA</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <AiActionButton
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Melhorar descrição"
              loading={loading === "improve_description"}
              disabled={!hasContent || loading !== null}
              onClick={() => callAi("improve_description")}
            />
            <AiActionButton
              icon={<Type className="h-3.5 w-3.5" />}
              label="Melhorar título"
              loading={loading === "improve_title"}
              disabled={!hasContent || loading !== null}
              onClick={() => callAi("improve_title")}
            />
            <AiActionButton
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Sugerir tags"
              loading={loading === "suggest_tags"}
              disabled={!hasContent || loading !== null}
              onClick={() => callAi("suggest_tags")}
            />
          </div>

          {/* Description results */}
          {descriptionResults && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-plum-600 uppercase tracking-wider">Versões da descrição</span>
                <button onClick={() => setDescriptionResults(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              <div className="flex gap-1.5">
                {(["improved", "short", "seo"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedDescVersion(v)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      selectedDescVersion === v
                        ? "bg-plum-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-plum-50"
                    }`}
                  >
                    {v === "improved" ? "Melhorada" : v === "short" ? "Curta" : "SEO"}
                  </button>
                ))}
              </div>
              <Textarea
                value={descriptionResults[selectedDescVersion]}
                onChange={(e) =>
                  setDescriptionResults({ ...descriptionResults, [selectedDescVersion]: e.target.value })
                }
                className="min-h-[80px] text-sm"
              />
              <Button
                size="sm"
                onClick={() => {
                  onApplyDescription?.(descriptionResults[selectedDescVersion]);
                  toast({ title: "Descrição aplicada ✨" });
                }}
                className="gap-1.5"
              >
                <Check className="h-3 w-3" /> Aplicar esta versão
              </Button>
            </div>
          )}

          {/* Title results */}
          {titleResults && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-plum-600 uppercase tracking-wider">Sugestões de título</span>
                <button onClick={() => setTitleResults(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              {titleResults.map((t, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground block">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.reason}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onApplyTitle?.(t.title);
                      toast({ title: "Título aplicado ✨" });
                    }}
                    className="shrink-0 text-xs"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Tag results */}
          {tagResults && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-plum-600 uppercase tracking-wider">Tags e SEO</span>
                <button onClick={() => setTagResults(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">Tags sugeridas</span>
                <div className="flex flex-wrap gap-1.5">
                  {tagResults.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-plum-50 border border-plum-200 px-2 py-0.5 text-xs text-plum-600 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">Palavras-chave</span>
                <div className="flex flex-wrap gap-1.5">
                  {tagResults.keywords.map((kw) => (
                    <span key={kw} className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs text-teal-600">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block mb-1">Meta description</span>
                <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">{tagResults.meta_description}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onApplyTags?.(tagResults.tags);
                  toast({ title: "Tags aplicadas ✨" });
                }}
                className="gap-1.5"
              >
                <Check className="h-3 w-3" /> Aplicar tags
              </Button>
            </div>
          )}

          {!hasContent && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Preencha o título ou a descrição para usar o assistente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AiActionButton({
  icon, label, loading, disabled, onClick,
}: {
  icon: React.ReactNode; label: string; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 text-xs font-medium text-foreground hover:border-plum-300 hover:bg-plum-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-plum-500" /> : icon}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
