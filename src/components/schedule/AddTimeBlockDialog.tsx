import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const FORMATS = ["One-shot", "Campanha", "Evento"];
const MODALITIES = ["Presencial", "Online", "Híbrido"];

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    accepted_formats_json: string[];
    accepted_modalities_json: string[];
  }) => void;
  initialDay?: number;
  role: "gm" | "store";
  saving?: boolean;
}

export function AddTimeBlockDialog({ open, onClose, onSave, initialDay = 1, role, saving }: Props) {
  const [day, setDay] = useState(initialDay);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [formats, setFormats] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = () => {
    if (startTime >= endTime) return;
    onSave({
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      accepted_formats_json: formats,
      accepted_modalities_json: modalities,
    });
  };

  // Reset when dialog opens with new day
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDay(initialDay);
      setStartTime("19:00");
      setEndTime("23:00");
      setFormats([]);
      setModalities([]);
    }
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar bloco de horário</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Day selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Dia da semana</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    day === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {startTime >= endTime && (
            <p className="text-xs text-destructive">O horário de fim deve ser posterior ao de início.</p>
          )}

          {/* Formats (GM only) */}
          {role === "gm" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Formatos aceitos</Label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <label key={f} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <Checkbox
                      checked={formats.includes(f)}
                      onCheckedChange={() => toggleItem(formats, setFormats, f)}
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Modalities */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Modalidades</Label>
            <div className="flex flex-wrap gap-2">
              {MODALITIES.map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={modalities.includes(m)}
                    onCheckedChange={() => toggleItem(modalities, setModalities, m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={startTime >= endTime || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
