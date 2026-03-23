import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, Video, Image, Loader2, Copy, Check, Download, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Mesa {
  id: string;
  title: string;
  system: string;
  description?: string;
  format: string;
  session_type: string;
}

interface ContentStudioPanelProps {
  mesas: Mesa[];
}

type ActionType = "session_script" | "video_script" | "post_image";

const ACTION_CARDS: { action: ActionType; icon: React.ReactNode; title: string; desc: string; color: string }[] = [
  {
    action: "session_script",
    icon: <FileText className="h-7 w-7" />,
    title: "Roteiro de Sessão",
    desc: "NPCs, cenas, combates e reviravoltas prontos para jogar",
    color: "from-primary/20 to-primary/5 text-primary",
  },
  {
    action: "video_script",
    icon: <Video className="h-7 w-7" />,
    title: "Script de Vídeo",
    desc: "Roteiro para Reels, TikTok ou Shorts (30–60s)",
    color: "from-secondary/20 to-secondary/5 text-secondary",
  },
  {
    action: "post_image",
    icon: <Image className="h-7 w-7" />,
    title: "Post para Redes",
    desc: "Imagem + legendas para Instagram, X e WhatsApp",
    color: "from-accent/30 to-accent/10 text-accent-foreground",
  },
];

export function ContentStudioPanel({ mesas }: ContentStudioPanelProps) {
  const [selectedMesaId, setSelectedMesaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [result, setResult] = useState<{ action: ActionType; content?: string; image?: { image_url: string; captions: any } } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedMesa = mesas.find((m) => m.id === selectedMesaId);

  const generate = async (action: ActionType) => {
    if (!selectedMesaId) {
      toast.error("Selecione uma mesa primeiro.");
      return;
    }
    setLoading(true);
    setLoadingAction(action);
    try {
      const { data, error } = await supabase.functions.invoke("gm-content-studio", {
        body: { action, mesa_id: selectedMesaId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === "post_image") {
        setResult({ action, image: data.result });
      } else {
        setResult({ action, content: data.result.content });
      }
      toast.success("Conteúdo gerado!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar conteúdo.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  // Result view
  if (result) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setResult(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar ao estúdio
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-display font-semibold text-foreground">
            {ACTION_CARDS.find(c => c.action === result.action)?.title}
          </h2>
        </div>

        {result.content && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyText(result.content!, "content")}>
                {copied === "content" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copiar tudo
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[600px] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {result.image && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <img src={result.image.image_url} alt="Post gerado por IA" className="w-full max-w-md mx-auto" />
            </div>
            <div className="flex justify-center">
              <a href={result.image.image_url} download="hivium-post.png" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Baixar Imagem
                </Button>
              </a>
            </div>
            {result.image.captions && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Instagram", key: "caption_instagram" },
                  { label: "Twitter / X", key: "caption_twitter" },
                  { label: "WhatsApp", key: "caption_whatsapp" },
                ].map(({ label, key }) => {
                  const text = result.image!.captions[key];
                  if (!text) return null;
                  return (
                    <div key={key} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyText(text, key)}>
                          {copied === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main view — card-based
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          Estúdio IA
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha a mesa, clique no card e a IA gera o conteúdo pra você.
        </p>
      </div>

      {/* Mesa selector */}
      <Select value={selectedMesaId} onValueChange={setSelectedMesaId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="🎲 Escolha uma mesa..." />
        </SelectTrigger>
        <SelectContent>
          {mesas.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.title} — {m.system}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMesa && (
        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">{selectedMesa.title}</p>
          <p className="text-xs text-muted-foreground">{selectedMesa.system} · {selectedMesa.format} · {selectedMesa.session_type}</p>
        </div>
      )}

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {ACTION_CARDS.map((card) => {
          const isGenerating = loading && loadingAction === card.action;
          return (
            <button
              key={card.action}
              onClick={() => generate(card.action)}
              disabled={loading || !selectedMesaId}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-to-b ${card.color} p-6 text-center transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isGenerating ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                card.icon
              )}
              <div>
                <p className="text-sm font-display font-semibold text-foreground">{card.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{card.desc}</p>
              </div>
              {isGenerating && (
                <p className="text-[10px] text-muted-foreground animate-pulse">Gerando com IA...</p>
              )}
            </button>
          );
        })}
      </div>

      {!selectedMesaId && mesas.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          ☝️ Selecione uma mesa acima para começar
        </p>
      )}

      {mesas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Você ainda não criou nenhuma mesa.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma mesa primeiro para usar o Estúdio IA.</p>
        </div>
      )}
    </div>
  );
}
