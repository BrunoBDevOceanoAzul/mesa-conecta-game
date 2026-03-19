import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { RPG_SYSTEMS } from "@/data/rpg-systems";

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

export function CreateMesaDialog({ onCreated, role, storeId, children }: CreateMesaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSystem("");
    setSessionType("one-shot");
    setFormat("presencial");
    setCity("");
    setVenue("");
    setMinPrice("");
    setMaxPrice("");
    setSeatsTotal("5");
    setStartAt("");
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !system || !startAt) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mesa", {
        body: {
          title: title.trim(),
          description: description.trim() || null,
          system,
          session_type: sessionType,
          format,
          city: city.trim() || null,
          venue: venue.trim() || null,
          min_price: Number(minPrice) || 0,
          max_price: Number(maxPrice) || Number(minPrice) || 0,
          seats_total: Number(seatsTotal) || 5,
          start_at: new Date(startAt).toISOString(),
          store_id: role === "store" ? storeId || user.id : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Mesa criada com sucesso! 🎲",
        description: data?.stripe_price_id
          ? "Produto e preço criados no Stripe automaticamente."
          : "Mesa publicada sem cobrança via Stripe.",
      });

      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err: any) {
      toast({
        title: "Erro ao criar mesa",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = title.trim() && system && startAt && !loading;

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

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <Label>Título da mesa *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: A Maldição de Strahd"
            />
          </div>

          {/* System */}
          <div>
            <Label>Sistema *</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger><SelectValue placeholder="Escolha o sistema" /></SelectTrigger>
              <SelectContent>
                {RPG_SYSTEMS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
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
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location (conditional) */}
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
              <Input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Preço máximo (R$)</Label>
              <Input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Se o preço for maior que R$0, um produto será criado automaticamente no Stripe vinculado à sua conta.
          </p>

          {/* Seats + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vagas totais *</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={seatsTotal}
                onChange={(e) => setSeatsTotal(e.target.value)}
              />
            </div>
            <div>
              <Label>Data e hora *</Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
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

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            Criar Mesa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
