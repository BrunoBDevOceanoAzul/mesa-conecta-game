import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Music, Upload, Play, Pause, Square, Repeat, Volume2, Loader2, Trash2
} from "lucide-react";

const AUDIO_CATEGORIES = [
  { value: "ambience", label: "Ambientação" },
  { value: "combat", label: "Combate" },
  { value: "mystery", label: "Mistério" },
  { value: "exploration", label: "Exploração" },
  { value: "jingle", label: "Vinheta" },
  { value: "sfx", label: "Efeito Sonoro" },
];

interface AudioAsset {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
  duration_seconds: number | null;
  default_volume: number;
  loop_enabled: boolean;
  description: string | null;
}

interface Props {
  mesaId: string;
  sessionId?: string | null;
}

export function Soundboard({ mesaId, sessionId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("ambience");
  const [uploadLoop, setUploadLoop] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchTracks = useCallback(async () => {
    const { data } = await supabase
      .from("session_assets")
      .select("id, title, category, file_url, duration_seconds, default_volume, loop_enabled, description")
      .eq("game_table_id", mesaId)
      .eq("asset_type", "audio")
      .order("category")
      .order("title");
    setTracks((data as AudioAsset[]) || []);
    setLoading(false);
  }, [mesaId]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  async function handleUpload() {
    if (!user || !uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    const ext = uploadFile.name.split(".").pop();
    const path = `${mesaId}/audio/${crypto.randomUUID()}.${ext}`;
    const { error: err } = await supabase.storage.from("session-assets").upload(path, uploadFile);
    if (err) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("session-assets").getPublicUrl(path);
    await supabase.from("session_assets").insert({
      game_table_id: mesaId,
      session_id: sessionId || null,
      asset_type: "audio",
      category: uploadCategory,
      title: uploadTitle.trim(),
      file_url: urlData.publicUrl,
      source_type: "upload",
      visibility_status: "private",
      loop_enabled: uploadLoop,
      default_volume: 0.8,
      created_by_user_id: user.id,
    } as any);
    toast({ title: "Áudio adicionado!" });
    setShowUpload(false);
    setUploadTitle(""); setUploadFile(null);
    setUploading(false);
    fetchTracks();
  }

  function playTrack(track: AudioAsset) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === track.id) {
      setPlayingId(null);
      return;
    }
    if (!track.file_url) return;
    const audio = new Audio(track.file_url);
    audio.volume = volume / 100;
    audio.loop = track.loop_enabled;
    audio.play();
    audio.onended = () => { if (!track.loop_enabled) setPlayingId(null); };
    audioRef.current = audio;
    setPlayingId(track.id);
  }

  function stopAll() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  async function deleteTrack(id: string) {
    if (playingId === id) stopAll();
    await supabase.from("session_assets").delete().eq("id", id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  // Group by category
  const grouped = AUDIO_CATEGORIES.map((cat) => ({
    ...cat,
    tracks: tracks.filter((t) => t.category === cat.value),
  })).filter((g) => g.tracks.length > 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button size="sm" className="gap-1.5" onClick={() => setShowUpload(true)}>
          <Upload className="h-3.5 w-3.5" /> Upload Áudio
        </Button>
        {playingId && (
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={stopAll}>
            <Square className="h-3.5 w-3.5" /> Parar
          </Button>
        )}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={5} className="flex-1" />
        <span className="text-xs text-muted-foreground w-8">{volume}%</span>
      </div>

      {/* Tracks */}
      <ScrollArea className="h-[360px]">
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.value} className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</h4>
              <div className="space-y-1">
                {group.tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      playingId === track.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"
                    }`}
                    onClick={() => playTrack(track)}
                  >
                    {playingId === track.id ? (
                      <Pause className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                    </div>
                    {track.loop_enabled && <Repeat className="h-3 w-3 text-muted-foreground" />}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tracks.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma trilha adicionada.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Music className="h-5 w-5" /> Upload de Áudio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Nome da trilha" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIO_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Loop</Label>
              <Switch checked={uploadLoop} onCheckedChange={setUploadLoop} />
            </div>
            <div>
              <Label className="text-xs">Arquivo de áudio</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
