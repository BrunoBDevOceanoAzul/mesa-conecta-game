import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenSquare, Send, Loader2, Sparkles, Wand2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { containsProfanity, PROFANITY_WARNING } from "@/lib/profanity-filter";
import { Badge } from "@/components/ui/badge";

interface CreatePostDialogProps {
  onCreated?: () => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80)
    .replace(/^-|-$/g, "");
}

export function CreatePostDialog({ onCreated }: CreatePostDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState("organic");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tables, setTables] = useState<{ id: string; title: string }[]>([]);
  const [relatedTableId, setRelatedTableId] = useState<string>("");
  const [profile, setProfile] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("profiles").select("role, name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
    supabase.from("game_tables").select("id, title").eq("gm_user_id", user.id).eq("status", "published").limit(20)
      .then(({ data }) => { if (data) setTables(data); });
  }, [user, open]);

  const handleAiGenerate = async (mode: "generate_text" | "improve_text" | "generate_image_prompt") => {
    if (!profile) return;
    setAiLoading(mode);
    try {
      const { data, error } = await supabase.functions.invoke("blog-ai-generate", {
        body: { mode, title, content, post_type: postType, author_role: profile.role },
      });
      if (error) throw error;

      if (mode === "generate_image_prompt" && data?.image_prompt) {
        toast({ title: "Prompt gerado!", description: "Gerando imagem de capa..." });
        // Generate image via AI
        const { data: imgData, error: imgErr } = await supabase.functions.invoke("mesa-ai-cover", {
          body: { prompt: data.image_prompt, aspect: "16:9" },
        });
        if (imgErr) throw imgErr;
        if (imgData?.image_url) {
          setImageUrl(imgData.image_url);
          toast({ title: "Capa gerada!", description: "A imagem foi aplicada ao post." });
        }
      } else if (data?.title || data?.content) {
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.tags?.length) setTags(data.tags);
        toast({ title: mode === "generate_text" ? "Conteúdo gerado!" : "Texto melhorado!", description: "Revise e ajuste antes de publicar." });
      }
    } catch (err: any) {
      toast({ title: "Erro na IA", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async () => {
    if (!user || !profile || !content.trim()) return;
    if (containsProfanity(content) || containsProfanity(title)) {
      toast({ title: "Conteúdo inadequado", description: PROFANITY_WARNING, variant: "destructive" });
      return;
    }
    setLoading(true);

    // Map frontend post types to API types
    const typeMap: Record<string, string> = {
      organic: "text",
      table_announcement: "mesa_share",
      event: "event",
      institutional: "announcement",
    };

    try {
      const response = await postsApi.create({
        content: content.trim(),
        type: (typeMap[postType] || "text") as any,
        mesaId: relatedTableId || undefined,
        mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      });
      const data = await response.json();
      setLoading(false);

      if (!data.ok) {
        toast({ title: "Erro ao publicar", description: data.error || "Tente novamente.", variant: "destructive" });
      } else {
        toast({ title: "Publicado!", description: "Seu post está no ar." });
        setContent(""); setTitle(""); setImageUrl(""); setRelatedTableId("");
        setPostType("organic"); setTags([]); setTagInput("");
        setOpen(false);
        onCreated?.();
      }
    } catch (err) {
      setLoading(false);
      toast({ title: "Erro ao publicar", description: err instanceof Error ? err.message : "Erro de rede", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <PenSquare className="h-4 w-4" /> Publicar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Nova publicação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* AI actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button" variant="outline" size="sm"
              disabled={!!aiLoading}
              onClick={() => handleAiGenerate("generate_text")}
              className="gap-1.5 text-xs"
            >
              {aiLoading === "generate_text" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Gerar com IA
            </Button>
            <Button
              type="button" variant="outline" size="sm"
              disabled={!!aiLoading || !content.trim()}
              onClick={() => handleAiGenerate("improve_text")}
              className="gap-1.5 text-xs"
            >
              {aiLoading === "improve_text" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              Melhorar texto
            </Button>
            <Button
              type="button" variant="outline" size="sm"
              disabled={!!aiLoading}
              onClick={() => handleAiGenerate("generate_image_prompt")}
              className="gap-1.5 text-xs"
            >
              {aiLoading === "generate_image_prompt" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Gerar capa IA
            </Button>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="organic">Post orgânico</SelectItem>
                <SelectItem value="table_announcement">Divulgação de mesa</SelectItem>
                <SelectItem value="event">Evento / Agenda</SelectItem>
                <SelectItem value="institutional">Comunicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Um título chamativo para SEO..." />
            {title.trim() && (
              <p className="text-[11px] text-muted-foreground mt-1">Slug: /post/{generateSlug(title)}</p>
            )}
          </div>

          <div>
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo no ecossistema?"
              className="min-h-[120px]"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (SEO)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="rpg, mesa, aventura..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/20" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>URL da imagem / capa</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          {tables.length > 0 && (
            <div>
              <Label>Vincular mesa (opcional)</Label>
              <Select value={relatedTableId} onValueChange={setRelatedTableId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
