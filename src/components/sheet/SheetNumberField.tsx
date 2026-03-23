import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface SheetNumberFieldProps {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  labelClass?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

/**
 * Compact stepper-style number field for stats like HP, Level, etc.
 */
export function SheetNumberField({
  label,
  value,
  onChange,
  disabled,
  labelClass,
  min = 0,
  max = 999,
  required,
}: SheetNumberFieldProps) {
  return (
    <div>
      <label className={cn("block mb-1.5", labelClass || "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="inline-flex items-center gap-0 rounded-lg border border-border/40 overflow-hidden">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange?.(Math.max(min, value - 1))}
          className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="h-9 w-12 flex items-center justify-center text-sm font-display font-bold text-foreground border-x border-border/40">
          {value}
        </div>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange?.(Math.min(max, value + 1))}
          className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
