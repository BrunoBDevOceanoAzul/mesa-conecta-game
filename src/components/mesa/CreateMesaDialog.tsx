import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Loader2, Swords, ImagePlus, X, Calculator, ChevronDown, Clock, LayoutGrid, Users } from "lucide-react";
import { PricingCalculator } from "@/components/gm/PricingCalculator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { RPG_SYSTEMS } from "@/data/rpg-systems";
import { MesaAiTextAssistant } from "./MesaAiTextAssistant";
import { MesaAiCoverGenerator } from "./MesaAiCoverGenerator";
import { BoardGameSearch, type BoardGame } from "@/components/shared/BoardGameSearch";

interface CreateMesaDialogProps {
  onCreated?: () => void;
  role: "gm" | "store";
  storeId?: string;
  children?: React.ReactNode;
}

const SESSION_TYPES = [
  { value: "one-shot", label: "One-Shot" },
  { value: "campanha", label: "Campanha" },
  { value: "evento", label: "Evento" },
];

const FORMATS = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "híbrido", label: "Híbrido" },
];

// Asaas fee references
const ASAAS_PIX_PERCENT = 1.99;
const ASAAS_CARD_PERCENT = 2.99;
const PLATFORM_FEE_PERCENT = 5; // 5% HIVIUM

export function CreateMesaDialog({ onCreated, role, storeId, children }: CreateMesaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [system, setSystem] = useState("");
  const [sessionType, setSessionType] = useState("one-shot");
  const [format, setFormat] = useState("presencial");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [seatsTotal, setSeatsTotal] = useState("5");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [sessionHours, setSessionHours] = useState("4");
  const [campaignSessions, setCampaignSessions] = useState("4");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [storeSlots, setStoreSlots] = useState<any[]>([]);
  const [selectedBoardGame, setSelectedBoardGame] = useState<BoardGame | null>(null);

  const isBoardGameMode = !!selectedBoardGame;

  // Fetch available store slots when role is store
  useEffect(() => {
    if (role !== "store" || !storeId || !open) return;
    supabase
      .from("store_time_slots")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "available")
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date")
      .order("start_time")
      .then(({ data }) => setStoreSlots(data || []));
  }, [role, storeId, open]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setSystem("");
    setSessionType("one-shot"); setFormat("presencial");
    setCity(""); setVenue(""); setMinPrice(""); setMaxPrice("");
    setSeatsTotal("5"); setStartAt(""); setEndAt("");
    setSessionHours("4"); setCampaignSessions("4");
    setCoverFile(null); setCoverPreview(null); setCoverUrl(null);
    setSelectedSlotId(null); setSelectedBoardGame(null);
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
    setCoverUrl(null);
  };

  const removeCover = () => {
    setCoverFile(null); setCoverPreview(null); setCoverUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAiCoverSelect = (url: string) => {
    setCoverUrl(url);
    setCoverPreview(url);
    setCoverFile(null);
  };

  const uploadCover = async (): Promise<string | null> => {
    if (coverUrl) return coverUrl; // AI-generated, already uploaded
    if (!coverFile || !user) return null;
    const ext = coverFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("mesa-covers").upload(path, coverFile, { upsert: true });
    if (error) throw new Error(`Upload falhou: ${error.message}`);
    const { data } = supabase.storage.from("mesa-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !system || !startAt) return;
    if (endAt && new Date(endAt) <= new Date(startAt)) {
      toast({ title: "Horário inválido", description: "O término deve ser após o início.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let finalCoverUrl: string | null = null;
      if (coverFile || coverUrl) finalCoverUrl = await uploadCover();

      const isCampaign = sessionType === "campanha";
      const { data, error } = await supabase.functions.invoke("create-mesa", {
        body: {
          title: title.trim(), description: description.trim() || null,
          system, session_type: sessionType, format,
          city: city.trim() || null, venue: venue.trim() || null,
          min_price: Number(minPrice) || 0, max_price: Number(maxPrice) || Number(minPrice) || 0,
          seats_total: Number(seatsTotal) || 5,
          start_at: new Date(startAt).toISOString(),
          end_at: endAt ? new Date(endAt).toISOString() : null,
          store_id: role === "store" ? storeId || user.id : null,
          cover_image_url: finalCoverUrl,
          store_slot_id: selectedSlotId || null,
          session_hours: Number(sessionHours) || 4,
          campaign_sessions: isCampaign ? Number(campaignSessions) || 4 : null,
          is_subscription: isCampaign,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Mesa criada com sucesso! 🎲",
        description: isCampaign
          ? `Campanha de ${campaignSessions} sessões configurada com cobrança recorrente.`
          : data?.asaas_billing_id
          ? "Cobrança Asaas criada automaticamente."
          : "Mesa publicada sem cobrança.",
      });
      resetForm(); setOpen(false); onCreated?.();
    } catch (err: any) {
      toast({ title: "Erro ao criar mesa", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = title.trim() && system && startAt && !loading;

  const durationText = startAt && endAt ? (() => {
    const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
  })() : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="hero" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Nova Mesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Criar Nova Mesa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Cover Image */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capa da aventura</Label>
            <p className="text-xs text-muted-foreground mb-2">Essa imagem pode ser o primeiro fator de interesse do jogador.</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border group">
                <img src={coverPreview} alt="Preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Trocar</Button>
                  <Button size="sm" variant="destructive" onClick={removeCover}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => fileInputRef.current?.click(), 0);
                }}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-plum-300 bg-muted/30 hover:bg-plum-50/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-plum-500"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Adicione uma imagem manualmente</span>
              </button>
            )}
          </div>

          {/* AI Cover Generator */}
          <MesaAiCoverGenerator
            title={title}
            description={description}
            system={system}
            sessionType={sessionType}
            format={format}
            onSelectCover={handleAiCoverSelect}
          />

          {/* Board Game Search (for stores and GMs) */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jogo do catálogo (opcional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Busque um jogo para autopreencher dados como imagem, jogadores e tempo.</p>
            <BoardGameSearch
              showExpansions={false}
              onSelect={(game: BoardGame) => {
                if (!title.trim()) setTitle(game.name);
                setSystem(game.name);
                if (game.thumbnail_url && !coverPreview) {
                  setCoverUrl(game.thumbnail_url);
                  setCoverPreview(game.thumbnail_url);
                }
                if (game.max_players) {
                  setSeatsTotal(String(game.max_players));
                }
                if (game.playing_time && !endAt && startAt) {
                  const start = new Date(startAt);
                  const end = new Date(start.getTime() + game.playing_time * 60000);
                  setEndAt(end.toISOString().slice(0, 16));
                }
                toast({
                  title: "Jogo selecionado!",
                  description: `${game.name} — ${game.min_players}-${game.max_players} jogadores, ${game.playing_time}min`,
                });
              }}
            />
          </div>

          {/* Store Slot Picker */}
          {role === "store" && storeSlots.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular a um slot de horário</Label>
              <p className="text-xs text-muted-foreground mb-2">Selecione um slot para preencher data/hora automaticamente e controlar a ocupação.</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-border p-2">
                {storeSlots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const isFull = slot.tables_booked >= slot.max_tables;
                  const d = new Date(slot.slot_date + "T00:00:00");
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSlotId(null);
                        } else {
                          setSelectedSlotId(slot.id);
                          const dateStr = slot.slot_date;
                          setStartAt(`${dateStr}T${slot.start_time}`);
                          setEndAt(`${dateStr}T${slot.end_time}`);
                        }
                      }}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : isFull
                          ? "border-border bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                          : "border-border bg-card hover:border-primary/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                          {" "}• {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><LayoutGrid className="h-3 w-3" />{slot.tables_booked}/{slot.max_tables}</span>
                          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{slot.seats_booked}/{slot.max_seats}</span>
                        </span>
                      </div>
                      {slot.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{slot.notes}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <Label>Título da mesa *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: A Maldição de Strahd" />
          </div>

          {/* System */}
          <div>
            <Label>Sistema *</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger><SelectValue placeholder="Escolha o sistema" /></SelectTrigger>
              <SelectContent>
                {RPG_SYSTEMS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Type + Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de sessão *</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          {format !== "online" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
              </div>
              <div>
                <Label>Local / Loja</Label>
                <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Nome do local" />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço mínimo (R$)</Label>
              <Input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Preço máximo (R$)</Label>
              <Input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="0" />
            </div>
          </div>
          {/* Asaas fee breakdown */}
          {Number(minPrice) > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 -mt-1 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">💰 Simulação de repasse Asaas</p>
              {(() => {
                const price = Number(minPrice);
                const asaasFeeCard = price * ASAAS_CARD_PERCENT / 100;
                const asaasFeePix = price * ASAAS_PIX_PERCENT / 100;
                const platformFee = price * PLATFORM_FEE_PERCENT / 100;
                const gmReceivesCard = price - asaasFeeCard - platformFee;
                const gmReceivesPix = price - asaasFeePix - platformFee;
                const suggestedPrice = Math.ceil((price / (1 - (ASAAS_PIX_PERCENT + PLATFORM_FEE_PERCENT) / 100)) / 0.50) * 0.50;
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valor cobrado do jogador</span>
                      <span className="font-medium text-foreground">R${price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxa Asaas PIX ({ASAAS_PIX_PERCENT}%)</span>
                      <span className="text-destructive font-medium">-R${asaasFeePix.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxa Asaas Cartão ({ASAAS_CARD_PERCENT}%)</span>
                      <span className="text-destructive font-medium">-R${asaasFeeCard.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxa HIVIUM ({PLATFORM_FEE_PERCENT}%)</span>
                      <span className="text-destructive font-medium">-R${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-1.5 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">Você recebe (PIX)</span>
                        <span className="font-bold text-secondary">R${gmReceivesPix.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">Você recebe (Cartão)</span>
                        <span className="font-bold text-muted-foreground">R${gmReceivesCard.toFixed(2)}</span>
                      </div>
                    </div>
                    {suggestedPrice > price && (
                      <div className="mt-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-primary font-medium">Sugestão: cobre R${suggestedPrice.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">Para receber ~R${(suggestedPrice * (1 - (ASAAS_PIX_PERCENT + PLATFORM_FEE_PERCENT) / 100)).toFixed(2)} líquido</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setMinPrice(suggestedPrice.toFixed(2));
                            setMaxPrice(suggestedPrice.toFixed(2));
                          }}
                        >
                          Aplicar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          <p className="text-xs text-muted-foreground -mt-3">
            Se o preço for maior que R$0, uma cobrança será criada automaticamente via Asaas.
          </p>

          {/* Pricing Calculator */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors -mt-1">
                <Calculator className="h-3.5 w-3.5" />
                Abrir calculadora de preços
                <ChevronDown className="h-3 w-3" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="rounded-xl border border-border overflow-hidden">
                <PricingCalculator
                  compact
                  onApplyPrice={(min, max) => {
                    setMinPrice(String(min));
                    setMaxPrice(String(max));
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
          {/* Session hours & campaign config */}
          <div className={`grid gap-3 ${sessionType === "campanha" ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <Label>Horas por sessão *</Label>
              <Input type="number" min="1" max="12" value={sessionHours} onChange={(e) => setSessionHours(e.target.value)} />
            </div>
            {sessionType === "campanha" && (
              <div>
                <Label>Nº de sessões</Label>
                <Input type="number" min="2" max="52" value={campaignSessions} onChange={(e) => setCampaignSessions(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Vagas totais *</Label>
              <Input type="number" min="1" max="30" value={seatsTotal} onChange={(e) => setSeatsTotal(e.target.value)} />
            </div>
          </div>

          {sessionType === "campanha" && Number(minPrice) > 0 && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">🔄 Assinatura recorrente (Campanha)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor por sessão/jogador</span>
                  <span className="font-medium text-foreground">R${Number(minPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessões na campanha</span>
                  <span className="font-medium text-foreground">{campaignSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recorrência</span>
                  <span className="font-medium text-foreground">Mensal ({sessionHours}h/sessão)</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between">
                  <span className="font-semibold text-foreground">Total estimado/jogador</span>
                  <span className="font-bold text-secondary">R${(Number(minPrice) * Number(campaignSessions)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          

          {/* Date & Time */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data e Horário</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div>
                <Label>Término previsto</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} min={startAt || undefined} />
              </div>
            </div>
            {durationText && (
              <p className="text-xs text-plum-500 font-medium">⏱ Duração estimada: {durationText}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a experiência, tom narrativo, etc."
              className="min-h-[80px]"
            />
          </div>

          {/* AI Text Assistant */}
          <MesaAiTextAssistant
            title={title}
            description={description}
            system={system}
            sessionType={sessionType}
            format={format}
            onApplyTitle={setTitle}
            onApplyDescription={setDescription}
          />

          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            Criar Mesa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
