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
  Image, Upload, Sparkles, Eye, EyeOff, Archive, Loader2, Trash2, LayoutGrid
} from "lucide-react";

const IMAGE_CATEGORIES = [
  { value: "scene", label: "Cena" },
  { value: "map", label: "Mapa" },
  { value: "npc", label: "NPC" },
  { value: "item", label: "Item" },
  { value: "clue", label: "Pista" },
  { value: "handout", label: "Handout" },
  { value: "card", label: "Carta" },
  { value: "ambience", label: "Ambientação" },
  { value: "cover", label: "Capa" },
];

const VISIBILITY_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  private: { label: "Privado", icon: EyeOff, cls: "text-muted-foreground" },
  staged: { label: "Preparado", icon: LayoutGrid, cls: "text-warning" },
  revealed: { label: "Revelado", icon: Eye, cls: "text-success" },
  archived: { label: "Arquivado", icon: Archive, cls: "text-muted-foreground/50" },
};

interface SessionAsset {
  id: string;
  asset_type: string;
  category: string;
  title: string;
  description: string | null;
  file_url: string | null;
  generated_prompt: string | null;
  source_type: string;
  visibility_status: string;
  sort_order: number;
  created_at: string;
}

interface Props {
  mesaId: string;
  sessionId?: string | null;
  mesaTitle?: string;
  mesaSystem?: string;
}

export function AssetManager({ mesaId, sessionId, mesaTitle, mesaSystem }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<SessionAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Upload form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("scene");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // AI Gen form
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("scene");
  const [aiTitle, setAiTitle] = useState("");

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase
      .from("session_assets")
      .select("*")
      .eq("game_table_id", mesaId)
      .eq("asset_type", "image")
      .order("sort_order")
      .order("created_at", { ascending: false });
    setAssets((data as SessionAsset[]) || []);
    setLoading(false);
  }, [mesaId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  async function handleUpload() {
    if (!user || !uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    const ext = uploadFile.name.split(".").pop();
    const path = `${mesaId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("session-assets").upload(path, uploadFile);
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("session-assets").getPublicUrl(path);
    await supabase.from("session_assets").insert({
      game_table_id: mesaId,
      session_id: sessionId || null,
      asset_type: "image",
      category: uploadCategory,
      title: uploadTitle.trim(),
      description: uploadDesc.trim() || null,
      file_url: urlData.publicUrl,
      source_type: "upload",
      visibility_status: "private",
      created_by_user_id: user.id,
    } as any);
    toast({ title: "Imagem adicionada!" });
    setShowUpload(false);
    setUploadTitle(""); setUploadDesc(""); setUploadFile(null);
    setUploading(false);
    fetchAssets();
  }

  async function handleAiGenerate() {
    if (!user || !aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("session-ai-image", {
        body: {
          prompt: aiPrompt,
          mesa_title: mesaTitle,
          mesa_system: mesaSystem,
          category: aiCategory,
        },
      });
      if (error) throw error;
      const imageUrl = data?.image_url;
      if (!imageUrl) throw new Error("No image returned");

      await supabase.from("session_assets").insert({
        game_table_id: mesaId,
        session_id: sessionId || null,
        asset_type: "image",
        category: aiCategory,
        title: aiTitle.trim() || `IA: ${aiCategory}`,
        generated_prompt: aiPrompt,
        file_url: imageUrl,
        source_type: "ai_generated",
        visibility_status: "private",
        created_by_user_id: user.id,
      } as any);
      toast({ title: "Imagem gerada com sucesso!" });
      setShowAiGen(false);
      setAiPrompt(""); setAiTitle("");
      fetchAssets();
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function updateVisibility(assetId: string, status: string) {
    await supabase.from("session_assets").update({ visibility_status: status } as any).eq("id", assetId);
    setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, visibility_status: status } : a));
  }

  async function deleteAsset(assetId: string) {
    await supabase.from("session_assets").delete().eq("id", assetId);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  }

  const filtered = filter === "all" ? assets : assets.filter((a) => a.visibility_status === filter);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => setShowUpload(true)}>
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setShowAiGen(true)}>
          <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {["all", "private", "staged", "revealed", "archived"].map((f) => (
          <Badge
            key={f}
            variant={filter === f ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : VISIBILITY_MAP[f]?.label || f}
          </Badge>
        ))}
      </div>

      {/* Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((asset) => {
            const vis = VISIBILITY_MAP[asset.visibility_status];
            const VisIcon = vis?.icon || EyeOff;
            return (
              <div key={asset.id} className="group relative rounded-xl border border-border bg-card overflow-hidden">
                {asset.file_url ? (
                  <img src={asset.file_url} alt={asset.title} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-muted flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate flex-1">{asset.title}</p>
                    <VisIcon className={`h-3.5 w-3.5 ${vis?.cls}`} />
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {IMAGE_CATEGORIES.find((c) => c.value === asset.category)?.label || asset.category}
                  </Badge>
                  {asset.source_type === "ai_generated" && <Badge variant="secondary" className="text-[9px] ml-1">IA</Badge>}
                </div>
                {/* Quick actions */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {asset.visibility_status !== "revealed" && (
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => updateVisibility(asset.id, "revealed")} title="Revelar">
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  {asset.visibility_status === "revealed" && (
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => updateVisibility(asset.id, "private")} title="Ocultar">
                      <EyeOff className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteAsset(asset.id)} title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-8 text-xs text-muted-foreground">
              Nenhuma imagem {filter !== "all" ? `com status "${VISIBILITY_MAP[filter]?.label}"` : "adicionada"}.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload de Imagem</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Nome do asset" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Arquivo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Gen Dialog */}
      <Dialog open={showAiGen} onOpenChange={setShowAiGen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Gerar Imagem com IA</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título do asset</Label>
              <Input value={aiTitle} onChange={(e) => setAiTitle(e.target.value)} placeholder="Ex: Taverna do Dragão" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={aiCategory} onValueChange={setAiCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prompt de geração *</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                placeholder={`Descreva a cena, NPC ou item que deseja gerar...\n\nO sistema "${mesaSystem || "RPG"}" e o título "${mesaTitle || ""}" serão usados como contexto adicional.`}
              />
            </div>
            <Button className="w-full" onClick={handleAiGenerate} disabled={generating || !aiPrompt.trim()}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar Imagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
