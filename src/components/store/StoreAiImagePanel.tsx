import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ImagePlus, Loader2, Download, RotateCcw, Wand2,
  Gamepad2, Swords, Trophy, Baby, DoorOpen, GraduationCap, PartyPopper
} from "lucide-react";

interface StoreAiImagePanelProps {
  storeName: string;
  city?: string;
}

const EVENT_TYPES = [
  { id: "board_game_night", label: "Noite de Jogos", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "rpg_session", label: "Sessão RPG", icon: <Swords className="h-4 w-4" /> },
  { id: "tournament", label: "Torneio", icon: <Trophy className="h-4 w-4" /> },
  { id: "kids_event", label: "Evento Kids", icon: <Baby className="h-4 w-4" /> },
  { id: "open_day", label: "Open House", icon: <DoorOpen className="h-4 w-4" /> },
  { id: "workshop", label: "Workshop", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "seasonal", label: "Sazonal", icon: <PartyPopper className="h-4 w-4" /> },
];

export function StoreAiImagePanel({ storeName, city }: StoreAiImagePanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("board_game_night");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<{ url: string; type: string }[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const body: Record<string, string> = {
        event_type: selectedType,
        store_name: storeName,
        city: city || "",
      };
      if (customPrompt.trim()) {
        body.prompt = customPrompt.trim();
      }

      const { data, error } = await supabase.functions.invoke("store-ai-image", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setGeneratedImages((prev) => [
        { url: data.image_url, type: selectedType },
        ...prev,
      ]);
      toast({ title: "Imagem gerada com sucesso! 🎨" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar imagem", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${storeName.replace(/\s+/g, "-").toLowerCase()}-evento-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-primary" />
        Gerador de Imagens para Eventos
      </h3>

      {/* Event type selector */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tipo de evento
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EVENT_TYPES.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setSelectedType(ev.id)}
              className={`rounded-xl border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${
                selectedType === ev.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {ev.icon}
                <span className="text-xs font-medium text-foreground">{ev.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt override */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Prompt personalizado (opcional)
        </span>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Descreva a imagem que deseja, ou deixe em branco para usar o prompt automático do tipo de evento..."
          className="min-h-[56px] text-xs"
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={loading}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando imagem...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            Gerar Imagem do Evento
          </>
        )}
      </Button>

      {/* Generated images gallery */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Imagens geradas ({generatedImages.length})
            </span>
            <button
              onClick={() => setGeneratedImages([])}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Limpar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {generatedImages.map((img, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-border bg-card"
              >
                <img
                  src={img.url}
                  alt={`Evento ${EVENT_TYPES.find((e) => e.id === img.type)?.label || img.type}`}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(img.url, i)}
                    className="text-xs gap-1.5"
                  >
                    <Download className="h-3 w-3" /> Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(img.url);
                      toast({ title: "URL copiada!" });
                    }}
                    className="text-xs"
                  >
                    Copiar URL
                  </Button>
                </div>
                <div className="px-3 py-2">
                  <span className="text-[10px] text-muted-foreground">
                    {EVENT_TYPES.find((e) => e.id === img.type)?.label || "Evento"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
