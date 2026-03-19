import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EXCEPTION_TYPES = [
  { value: "blocked", label: "Bloqueado", desc: "Indisponível neste dia" },
  { value: "custom_hours", label: "Horário especial", desc: "Horário diferente do recorrente" },
  { value: "special_event", label: "Evento especial", desc: "Ativação ou evento temático" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    exception_date: string;
    exception_type: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }) => void;
  saving?: boolean;
}

export function AddExceptionDialog({ open, onClose, onSave, saving }: Props) {
  const [date, setDate] = useState("");
  const [type, setType] = useState("blocked");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [notes, setNotes] = useState("");

  const showTimes = type === "custom_hours" || type === "special_event";

  const handleSave = () => {
    if (!date) return;
    onSave({
      exception_date: date,
      exception_type: type,
      ...(showTimes ? { start_time: startTime, end_time: endTime } : {}),
      ...(notes ? { notes } : {}),
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDate("");
      setType("blocked");
      setStartTime("19:00");
      setEndTime("23:00");
      setNotes("");
    }
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar exceção</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Exception type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de exceção</Label>
            <div className="space-y-2">
              {EXCEPTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    type === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom times */}
          {showTimes && (
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
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observação (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Feriado, evento especial..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!date || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
