import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ImagePlus, Sparkles, Loader2, Wand2, Check, RotateCcw, ChevronDown, ChevronUp, Palette
} from "lucide-react";

interface MesaAiCoverGeneratorProps {
  title: string;
  description: string;
  system: string;
  sessionType: string;
  format: string;
  onSelectCover: (url: string) => void;
}

const IMAGE_STYLES = [
  { id: "cinematic_fantasy", label: "Fantasia Épica", desc: "Poster cinematográfico de fantasia" },
  { id: "dark_horror", label: "Horror Investigativo", desc: "Atmosfera sombria e misteriosa" },
  { id: "dark_fantasy", label: "Dark Fantasy", desc: "Fantasia com tons sombrios" },
  { id: "scifi", label: "Sci-Fi", desc: "Ficção científica e futurismo" },
  { id: "pulp_adventure", label: "Aventura Pulp", desc: "Estilo pulp clássico e vibrante" },
  { id: "classic_rpg", label: "RPG Clássico", desc: "Estilo old-school de ilustração" },
  { id: "editorial", label: "Capa Editorial", desc: "Elegante e minimalista" },
  { id: "poster", label: "Poster Cinemático", desc: "Alta produção visual" },
];

export function MesaAiCoverGenerator({
  title, description, system, sessionType, format, onSelectCover,
}: MesaAiCoverGeneratorProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("cinematic_fantasy");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedPrompts, setGeneratedPrompts] = useState<{
    prompt: string; style: string; description_pt: string;
  }[] | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string }[]>([]);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);

  const hasContent = title || description;

  const generatePrompts = async () => {
    if (!hasContent) return;
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase.functions.invoke("mesa-ai-assist", {
        body: {
          action: "generate_cover_prompt",
          title, description, system, session_type: sessionType, format,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPrompts(data.result.prompts);
      if (data.result.prompts.length > 0) {
        setCustomPrompt(data.result.prompts[0].prompt);
        setSelectedPromptIdx(0);
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar prompts", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPrompts(false);
    }
  };

  const generateImage = async (prompt?: string) => {
    const p = prompt || customPrompt;
    if (!p) {
      toast({ title: "Escreva ou gere um prompt primeiro", variant: "destructive" });
      return;
    }
    setLoadingImage(true);
    try {
      const style = IMAGE_STYLES.find((s) => s.id === selectedStyle);
      const { data, error } = await supabase.functions.invoke("mesa-ai-cover", {
        body: { prompt: p, style: style?.label || selectedStyle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedImages((prev) => [{ url: data.image_url, prompt: p }, ...prev]);
      toast({ title: "Capa gerada com sucesso! 🎨" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar imagem", description: err.message, variant: "destructive" });
    } finally {
      setLoadingImage(false);
    }
  };

  return (
    <div className="rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50/50 to-plum-50/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gold-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-500 to-coral-400 flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">Capa com IA</span>
            <span className="text-[11px] text-muted-foreground">Crie uma capa para sua aventura com IA</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Step 1: Generate prompts or write custom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold-600 uppercase tracking-wider">1. Prompt da imagem</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={generatePrompts}
                disabled={!hasContent || loadingPrompts}
                className="text-xs gap-1.5 text-plum-500"
              >
                {loadingPrompts ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Gerar com IA
              </Button>
            </div>

            {/* AI-generated prompt options */}
            {generatedPrompts && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {generatedPrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCustomPrompt(p.prompt);
                      setSelectedPromptIdx(i);
                    }}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all ${
                      selectedPromptIdx === i
                        ? "border-gold-300 bg-gold-50/50"
                        : "border-border bg-card hover:border-gold-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Palette className="h-3 w-3 text-gold-500" />
                      <span className="text-xs font-semibold text-foreground">{p.style}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{p.description_pt}</span>
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Descreva a capa que você imagina para sua aventura (em inglês ou português)..."
              className="min-h-[60px] text-xs"
            />
          </div>

          {/* Step 2: Style */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-wider">2. Estilo visual</span>
            <div className="grid grid-cols-4 gap-1.5">
              {IMAGE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={`rounded-lg border px-1.5 py-1.5 text-[10px] font-medium text-center transition-all ${
                    selectedStyle === s.id
                      ? "border-gold-400 bg-gold-50 text-gold-600"
                      : "border-border text-muted-foreground hover:border-gold-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Generate */}
          <Button
            onClick={() => generateImage()}
            disabled={!customPrompt || loadingImage}
            className="w-full gap-2"
            style={{ backgroundImage: "var(--gradient-cta)" }}
          >
            {loadingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando capa...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Gerar Capa
              </>
            )}
          </Button>

          {/* Generated images */}
          {generatedImages.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gold-600 uppercase tracking-wider">
                  Capas geradas ({generatedImages.length})
                </span>
                <button
                  onClick={() => setGeneratedImages([])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Limpar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {generatedImages.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img src={img.url} alt={`Capa ${i + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onSelectCover(img.url);
                          toast({ title: "Capa selecionada! 🎨" });
                        }}
                        className="text-xs gap-1"
                      >
                        <Check className="h-3 w-3" /> Usar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasContent && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Preencha o título ou a descrição para gerar capas com IA.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
