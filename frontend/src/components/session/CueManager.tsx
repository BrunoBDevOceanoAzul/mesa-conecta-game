import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Clapperboard, Plus, Play, Image, Music, Loader2, Trash2
} from "lucide-react";

interface SessionCue {
  id: string;
  title: string;
  description: string | null;
  image_asset_id: string | null;
  audio_asset_id: string | null;
  sort_order: number;
  is_active: boolean;
}

interface AssetOption {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
}

interface Props {
  mesaId: string;
  sessionId?: string | null;
}

export function CueManager({ mesaId, sessionId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cues, setCues] = useState<SessionCue[]>([]);
  const [imageAssets, setImageAssets] = useState<AssetOption[]>([]);
  const [audioAssets, setAudioAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageId, setNewImageId] = useState("");
  const [newAudioId, setNewAudioId] = useState("");

  const fetchAll = useCallback(async () => {
    const [cuesRes, imagesRes, audiosRes] = await Promise.all([
      supabase.from("session_cues").select("*").eq("game_table_id", mesaId).order("sort_order"),
      supabase.from("session_assets").select("id, title, category, file_url").eq("game_table_id", mesaId).eq("asset_type", "image"),
      supabase.from("session_assets").select("id, title, category, file_url").eq("game_table_id", mesaId).eq("asset_type", "audio"),
    ]);
    setCues((cuesRes.data as SessionCue[]) || []);
    setImageAssets((imagesRes.data as AssetOption[]) || []);
    setAudioAssets((audiosRes.data as AssetOption[]) || []);
    setLoading(false);
  }, [mesaId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function createCue() {
    if (!user || !newTitle.trim()) return;
    setSaving(true);
    await supabase.from("session_cues").insert({
      game_table_id: mesaId,
      session_id: sessionId || null,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      image_asset_id: newImageId || null,
      audio_asset_id: newAudioId || null,
      sort_order: cues.length,
    } as any);
    toast({ title: "Cue criado!" });
    setShowCreate(false);
    setNewTitle(""); setNewDesc(""); setNewImageId(""); setNewAudioId("");
    setSaving(false);
    fetchAll();
  }

  async function activateCue(cueId: string) {
    // Deactivate all, activate selected
    await supabase.from("session_cues").update({ is_active: false } as any).eq("game_table_id", mesaId);
    await supabase.from("session_cues").update({ is_active: true } as any).eq("id", cueId);

    const cue = cues.find((c) => c.id === cueId);
    if (cue?.image_asset_id) {
      // Hide all images, reveal cue's image
      await supabase.from("session_assets").update({ visibility_status: "private" } as any).eq("game_table_id", mesaId).eq("asset_type", "image").eq("visibility_status", "revealed");
      await supabase.from("session_assets").update({ visibility_status: "revealed" } as any).eq("id", cue.image_asset_id);
    }

    setCues((prev) => prev.map((c) => ({ ...c, is_active: c.id === cueId })));
    toast({ title: `Cue "${cue?.title}" ativado!` });
  }

  async function deleteCue(cueId: string) {
    await supabase.from("session_cues").delete().eq("id", cueId);
    setCues((prev) => prev.filter((c) => c.id !== cueId));
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
        <Plus className="h-3.5 w-3.5" /> Nova Cue
      </Button>

      <ScrollArea className="h-[420px]">
        <div className="space-y-2">
          {cues.map((cue, idx) => {
            const img = imageAssets.find((a) => a.id === cue.image_asset_id);
            const aud = audioAssets.find((a) => a.id === cue.audio_asset_id);
            return (
              <div
                key={cue.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  cue.is_active ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {img?.file_url ? (
                    <img src={img.file_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                    <p className="text-sm font-medium truncate">{cue.title}</p>
                    {cue.is_active && <Badge className="text-[9px]">Ativa</Badge>}
                  </div>
                  {cue.description && <p className="text-xs text-muted-foreground truncate">{cue.description}</p>}
                  <div className="flex gap-2">
                    {img && <Badge variant="outline" className="text-[9px] gap-1"><Image className="h-2.5 w-2.5" />{img.title}</Badge>}
                    {aud && <Badge variant="outline" className="text-[9px] gap-1"><Music className="h-2.5 w-2.5" />{aud.title}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant={cue.is_active ? "default" : "outline"} className="h-8 w-8" onClick={() => activateCue(cue.id)} title="Ativar cue">
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCue(cue.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {cues.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <Clapperboard className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Crie cues para organizar momentos da sessão.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Clapperboard className="h-5 w-5" /> Nova Cue</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Encontro na Taverna" />
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Imagem</Label>
              <Select value={newImageId} onValueChange={setNewImageId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma imagem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {imageAssets.map((a) => <SelectItem key={a.id} value={a.id}>{a.title} ({a.category})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Áudio</Label>
              <Select value={newAudioId} onValueChange={setNewAudioId}>
                <SelectTrigger><SelectValue placeholder="Nenhum áudio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {audioAssets.map((a) => <SelectItem key={a.id} value={a.id}>{a.title} ({a.category})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={createCue} disabled={saving || !newTitle.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Cue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
