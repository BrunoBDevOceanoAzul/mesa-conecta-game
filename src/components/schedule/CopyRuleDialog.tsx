import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetDays: number[]) => void;
  excludeDay?: number;
  saving?: boolean;
}

export function CopyRuleDialog({ open, onClose, onConfirm, excludeDay, saving }: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (day: number) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setSelected([]);
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Copiar horário para outros dias</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {DAYS.map((d, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                i === excludeDay
                  ? "opacity-30 pointer-events-none border-border"
                  : selected.includes(i)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/20"
              }`}
            >
              <Checkbox
                checked={selected.includes(i)}
                onCheckedChange={() => toggle(i)}
                disabled={i === excludeDay}
              />
              <span className="text-sm text-foreground">{d}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(selected)} disabled={selected.length === 0 || saving}>
            {saving ? "Copiando…" : `Copiar para ${selected.length} dia${selected.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
