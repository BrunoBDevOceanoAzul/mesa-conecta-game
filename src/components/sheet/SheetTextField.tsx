import { cn } from "@/lib/utils";

interface SheetTextFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  labelClass?: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}

/**
 * Themed text field that looks like a line on a paper sheet.
 * Uses bottom-border style for that classic sheet feel.
 */
export function SheetTextField({
  label,
  value,
  onChange,
  disabled,
  labelClass,
  placeholder,
  multiline,
  required,
}: SheetTextFieldProps) {
  const baseClass =
    "w-full bg-transparent border-0 border-b-2 border-border/40 px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-[hsl(var(--sheet-accent,270_48%_49%))] transition-colors";

  return (
    <div>
      <label className={cn("block mb-1", labelClass || "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className={cn(baseClass, "resize-none min-h-[72px]")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}
