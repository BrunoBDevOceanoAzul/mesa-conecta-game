import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { containsProfanity, PROFANITY_WARNING } from "@/lib/profanity-filter";

interface CreatePostDialogProps {
  onCreated?: () => void;
}

export function CreatePostDialog({ onCreated }: CreatePostDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState("organic");
  const [imageUrl, setImageUrl] = useState("");
  const [tables, setTables] = useState<{ id: string; title: string }[]>([]);
  const [relatedTableId, setRelatedTableId] = useState<string>("");
  const [profile, setProfile] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    // Fetch profile
    supabase.from("profiles").select("role, name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
    // Fetch user's tables for linking
    supabase.from("game_tables").select("id, title").eq("gm_user_id", user.id).eq("status", "published").limit(20)
      .then(({ data }) => {
        if (data) setTables(data);
      });
  }, [user, open]);

  const canPost = profile && ["gm", "store", "brand", "admin"].includes(profile.role);

  const handleSubmit = async () => {
    if (!user || !profile || !content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("community_posts").insert({
      author_id: user.id,
      author_role: profile.role,
      post_type: postType,
      title: title.trim() || null,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      related_table_id: relatedTableId || null,
      status: "published",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Publicado!", description: "Seu post está no ar." });
      setContent("");
      setTitle("");
      setImageUrl("");
      setRelatedTableId("");
      setPostType("organic");
      setOpen(false);
      onCreated?.();
    }
  };

  if (!user || !canPost) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <PenSquare className="h-4 w-4" /> Publicar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Nova publicação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
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
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título chamativo..." />
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
          <div>
            <Label>URL da imagem (opcional)</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
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
