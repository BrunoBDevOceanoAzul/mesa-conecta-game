import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Gamepad2, ImagePlus, X, MapPin, Sparkles, Share2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BoardGameSearch, type BoardGame } from "@/components/shared/BoardGameSearch";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";

interface CreateCommunityMesaDialogProps {
  onCreated?: () => void;
  children?: React.ReactNode;
}

const FORMATS = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "híbrido", label: "Híbrido" },
];

export function CreateCommunityMesaDialog({ onCreated, children }: CreateCommunityMesaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [shareStep, setShareStep] = useState(false);
  const [createdMesaId, setCreatedMesaId] = useState<string | null>(null);
  const [shareText, setShareText] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coverAiLoading, setCoverAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("presencial");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [address, setAddress] = useState("");
  const [seatsTotal, setSeatsTotal] = useState("4");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedGame(null);
    setTitle(""); setDescription(""); setFormat("presencial");
    setCity(""); setLat(undefined); setLng(undefined); setAddress("");
    setSeatsTotal("4"); setStartAt(""); setEndAt("");
    setCoverFile(null); setCoverPreview(null);
    setShareStep(false); setCreatedMesaId(null); setShareText(""); setCopied(false);
  };

  const handleGameSelect = (game: BoardGame) => {
    setSelectedGame(game);
    if (!title.trim()) setTitle(game.name);
    if (game.max_players && !seatsTotal) setSeatsTotal(String(game.max_players));
    if (game.thumbnail_url && !coverPreview) setCoverPreview(game.thumbnail_url);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null); setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadCover = async (): Promise<string | null> => {
    // AI-generated cover already uploaded to storage — use URL directly
    if (coverPreview && !coverFile && coverPreview.startsWith("http")) return coverPreview;
    if (selectedGame?.thumbnail_url && !coverFile) return selectedGame.thumbnail_url;
    if (!coverFile || !user) return null;
    const ext = coverFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("mesa-covers").upload(path, coverFile, { upsert: true });
    if (error) throw new Error(`Upload falhou: ${error.message}`);
    const { data } = supabase.storage.from("mesa-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  // AI: Generate description
  const generateDescription = async () => {
    if (!title.trim()) {
      toast({ title: "Preencha o nome da mesa primeiro", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mesa-community-ai", {
        body: {
          action: "generate_description",
          title,
          gameName: selectedGame?.name || title,
          format,
          city,
          seats: seatsTotal,
        },
      });
      if (error) throw error;
      if (data?.description) {
        setDescription(data.description);
        toast({ title: "Descrição gerada! ✨", description: "Edite se quiser personalizar." });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar descrição", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // AI: Generate cover image
  const generateAiCover = async () => {
    if (!title.trim()) {
      toast({ title: "Preencha o nome da mesa primeiro", variant: "destructive" });
      return;
    }
    setCoverAiLoading(true);
    try {
      const gameName = selectedGame?.name || title;
      const prompt = `A vibrant, inviting board game night scene for "${gameName}". Show a table with the game setup, warm ambient lighting, cozy atmosphere, friends gathering to play`;
      
      const { data, error } = await supabase.functions.invoke("mesa-ai-cover", {
        body: { prompt, style: "colorful board game illustration, warm and inviting, modern flat illustration style" },
      });
      if (error) throw error;
      if (data?.image_url) {
        setCoverPreview(data.image_url);
        setCoverFile(null); // AI-generated, URL is already uploaded
        toast({ title: "Capa gerada! 🎨", description: "Ficou bonita? Pode trocar se quiser." });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar capa", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setCoverAiLoading(false);
    }
  };

  // Generate share text after creation
  const generateShareText = async (mesaId: string) => {
    setShareLoading(true);
    try {
      const mesaUrl = `${window.location.origin}/mesa/${mesaId}`;
      const { data, error } = await supabase.functions.invoke("mesa-community-ai", {
        body: {
          action: "generate_share_text",
          title,
          gameName: selectedGame?.name || title,
          format,
          city,
          seats: seatsTotal,
          description,
        },
      });
      if (error) throw error;
      const text = data?.shareText || `🎲 ${title} — ${seatsTotal} vagas! Bora jogar?`;
      setShareText(`${text}\n\n👉 ${mesaUrl}`);
    } catch {
      const mesaUrl = `${window.location.origin}/mesa/${mesaId}`;
      setShareText(`🎲 ${title} — ${seatsTotal} vagas!\n\n👉 ${mesaUrl}`);
    } finally {
      setShareLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !startAt) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      let finalCoverUrl: string | null = null;
      if (coverFile || (selectedGame?.thumbnail_url && !coverFile)) {
        finalCoverUrl = await uploadCover();
      }

      const organizerName = profile?.display_name || profile?.name || user.email?.split("@")[0] || "Organizador";

      const { data, error } = await supabase
        .from("mesas")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          system: selectedGame?.name || "Jogo de Tabuleiro",
          session_type: "evento",
          format,
          city: city || null,
          venue: address || null,
          lat: lat || null,
          lng: lng || null,
          address: address || null,
          min_price: 0,
          max_price: 0,
          seats_total: Number(seatsTotal) || 4,
          seats_available: Number(seatsTotal) || 4,
          gm_id: user.id,
          gm_name: organizerName,
          organizer_name: organizerName,
          start_at: new Date(startAt).toISOString(),
          end_at: endAt ? new Date(endAt).toISOString() : null,
          status: "aberta",
          tags: selectedGame ? [selectedGame.type] : [],
          cover_image_url: finalCoverUrl,
          mesa_type: "community",
          board_game_id: selectedGame?.id || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        await supabase.from("mesa_engagement_metrics" as any).insert({
          mesa_id: data.id,
          user_id: user.id,
          event_type: "created",
        });

        setCreatedMesaId(data.id);
        setShareStep(true);
        generateShareText(data.id);

        toast({
          title: "Mesa publicada! 🎲",
          description: "Agora compartilhe para atrair jogadores!",
        });
      }

      onCreated?.();
    } catch (err: any) {
      toast({ title: "Erro ao criar mesa", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/mesa/${createdMesaId}`)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const canSubmit = title.trim() && startAt && !loading;

  // ─── Share step after creation ───
  if (shareStep) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="hero" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Organizar Mesa
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartilhe nos grupos!
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Convide jogadores copiando a mensagem abaixo e enviando nos seus grupos de jogos.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {shareLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Gerando convite com IA...</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    rows={5}
                    className="pr-10 text-sm"
                  />
                  <button
                    onClick={copyShareText}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    title="Copiar"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>

                <Button
                  onClick={copyShareText}
                  className="w-full gap-2"
                  variant="hero"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado!" : "Copiar mensagem"}
                </Button>

                <button
                  onClick={() => handleClose(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Pular e fechar
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Creation form ───
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="hero" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Organizar Mesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Organizar uma Mesa
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Publique sua mesa de jogo e encontre jogadores na comunidade. É grátis!
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Step 1: Choose game */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              1. Escolha o jogo
            </Label>
            <BoardGameSearch
              onSelect={handleGameSelect}
              showExpansions={false}
              placeholder="Buscar jogo no catálogo..."
            />
          </div>

          {/* Title */}
          <div>
            <Label>Nome da mesa *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedGame ? `Ex: ${selectedGame.name} no sábado` : "Ex: Catan com a galera"}
            />
          </div>

          {/* Description with AI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateDescription}
                disabled={aiLoading || !title.trim()}
                className="h-7 gap-1.5 text-xs text-primary hover:text-primary/80 px-2"
              >
                {aiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {aiLoading ? "Gerando..." : "Gerar com IA"}
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Regras da casa, nível de experiência, o que levar..."
              rows={2}
            />
          </div>

          {/* Format */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              2. Formato
            </Label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    format === f.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          {format !== "online" && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                3. Onde vai ser?
              </Label>
              <CityAutocomplete
                value={city}
                onChange={(cityVal, latVal, lngVal) => {
                  setCity(cityVal);
                  if (latVal) setLat(latVal);
                  if (lngVal) setLng(lngVal);
                }}
                placeholder="Cidade..."
              />
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Endereço ou nome do local (ex: minha casa, café X...)"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Seats */}
          <div>
            <Label>Vagas (incluindo você)</Label>
            <Input
              type="number"
              min="2"
              max="20"
              value={seatsTotal}
              onChange={(e) => setSeatsTotal(e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              4. Quando?
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Início *</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Término previsto</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Capa <span className="font-normal">(opcional)</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateAiCover}
                disabled={coverAiLoading || !title.trim()}
                className="h-7 gap-1.5 text-xs text-primary hover:text-primary/80 px-2"
              >
                {coverAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {coverAiLoading ? "Gerando capa..." : "Gerar com IA"}
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border group">
                <img src={coverPreview} alt="Preview" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Trocar</Button>
                  <Button size="sm" variant="ghost" className="text-white" onClick={generateAiCover} disabled={coverAiLoading}>
                    {coverAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={removeCover}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm"
                >
                  <ImagePlus className="h-5 w-5" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={generateAiCover}
                  disabled={coverAiLoading || !title.trim()}
                  className="flex-1 h-20 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 transition-all flex items-center justify-center gap-2 text-primary text-sm disabled:opacity-50"
                >
                  {coverAiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {coverAiLoading ? "Gerando..." : "Capa IA"}
                </button>
              </div>
            )}
          </div>

          {/* Free badge */}
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-3 text-center">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
              ✨ Mesas da comunidade são 100% gratuitas
            </p>
            <p className="text-xs text-teal-600/80 dark:text-teal-500 mt-0.5">
              Organize, jogue e conecte-se com outros jogadores sem custo.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full gap-2"
            variant="hero"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
            ) : (
              <><Gamepad2 className="h-4 w-4" /> Publicar Mesa</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
