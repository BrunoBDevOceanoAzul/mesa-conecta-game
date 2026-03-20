import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, Video, Image, Loader2, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";

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

export function ContentStudioPanel({ mesas }: ContentStudioPanelProps) {
  const [selectedMesaId, setSelectedMesaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("session_script");

  // Results
  const [sessionScript, setSessionScript] = useState<string>("");
  const [videoScript, setVideoScript] = useState<string>("");
  const [postImage, setPostImage] = useState<{ image_url: string; captions: any } | null>(null);

  const [copied, setCopied] = useState(false);

  const selectedMesa = mesas.find((m) => m.id === selectedMesaId);

  const generate = async (action: string) => {
    if (!selectedMesaId) {
      toast.error("Selecione uma mesa primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gm-content-studio", {
        body: { action, mesa_id: selectedMesaId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      switch (action) {
        case "session_script":
          setSessionScript(data.result.content);
          break;
        case "video_script":
          setVideoScript(data.result.content);
          break;
        case "post_image":
          setPostImage(data.result);
          break;
      }
      toast.success("Conteúdo gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar conteúdo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          Estúdio de Conteúdo IA
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gere roteiros, vídeos e imagens de post a partir das suas mesas com inteligência artificial.
        </p>
      </div>

      {/* Mesa selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Selecione a mesa</label>
        <Select value={selectedMesaId} onValueChange={setSelectedMesaId}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Escolha uma mesa..." />
          </SelectTrigger>
          <SelectContent>
            {mesas.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title} — {m.system}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMesa && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">{selectedMesa.title}</p>
          <p className="text-xs text-muted-foreground">{selectedMesa.system} · {selectedMesa.format} · {selectedMesa.session_type}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="session_script" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Roteiro
          </TabsTrigger>
          <TabsTrigger value="video_script" className="gap-1.5 text-xs">
            <Video className="h-3.5 w-3.5" /> Vídeo
          </TabsTrigger>
          <TabsTrigger value="post_image" className="gap-1.5 text-xs">
            <Image className="h-3.5 w-3.5" /> Post
          </TabsTrigger>
        </TabsList>

        {/* Session Script */}
        <TabsContent value="session_script" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Roteiro de Sessão</h3>
              <p className="text-xs text-muted-foreground">Gere um roteiro completo com NPCs, cenas e reviravoltas.</p>
            </div>
            <Button onClick={() => generate("session_script")} disabled={loading || !selectedMesaId} size="sm" className="gap-1.5">
              {loading && activeTab === "session_script" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Gerar Roteiro
            </Button>
          </div>

          {sessionScript && (
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(sessionScript)}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copiar
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 prose prose-sm prose-invert max-w-none overflow-auto max-h-[600px]">
                <MarkdownRenderer content={sessionScript} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Video Script */}
        <TabsContent value="video_script" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Roteiro de Vídeo Promocional</h3>
              <p className="text-xs text-muted-foreground">Script para Reels/TikTok/Shorts (30-60s).</p>
            </div>
            <Button onClick={() => generate("video_script")} disabled={loading || !selectedMesaId} size="sm" className="gap-1.5">
              {loading && activeTab === "video_script" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
              Gerar Script
            </Button>
          </div>

          {videoScript && (
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(videoScript)}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copiar
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 prose prose-sm prose-invert max-w-none overflow-auto max-h-[600px]">
                <MarkdownRenderer content={videoScript} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Post Image */}
        <TabsContent value="post_image" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Imagem + Legenda para Post</h3>
              <p className="text-xs text-muted-foreground">Arte visual + legendas prontas para Instagram, Twitter e WhatsApp.</p>
            </div>
            <Button onClick={() => generate("post_image")} disabled={loading || !selectedMesaId} size="sm" className="gap-1.5">
              {loading && activeTab === "post_image" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
              Gerar Post
            </Button>
          </div>

          {postImage && (
            <div className="space-y-4">
              {/* Generated image */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <img
                  src={postImage.image_url}
                  alt="Post gerado por IA"
                  className="w-full max-w-lg mx-auto"
                />
              </div>

              {/* Download button */}
              <div className="flex justify-center">
                <a href={postImage.image_url} download="hivium-post.png" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Baixar Imagem
                  </Button>
                </a>
              </div>

              {/* Captions */}
              {postImage.captions && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <CaptionCard
                    platform="Instagram"
                    text={postImage.captions.caption_instagram}
                    onCopy={() => copyToClipboard(postImage.captions.caption_instagram)}
                  />
                  <CaptionCard
                    platform="Twitter / X"
                    text={postImage.captions.caption_twitter}
                    onCopy={() => copyToClipboard(postImage.captions.caption_twitter)}
                  />
                  <CaptionCard
                    platform="WhatsApp"
                    text={postImage.captions.caption_whatsapp}
                    onCopy={() => copyToClipboard(postImage.captions.caption_whatsapp)}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaptionCard({ platform, text, onCopy }: { platform: string; text: string; onCopy: () => void }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{platform}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCopy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown-to-html (headers, bold, lists)
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground">$1. $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
