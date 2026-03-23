import { cn } from "@/lib/utils";

interface SheetDotRatingProps {
  value: number;
  max: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  filledClass?: string;
  emptyClass?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Dot rating — the classic RPG circles (●●●○○).
 * Click a dot to set the value; click the same dot to clear.
 */
export function SheetDotRating({
  value,
  max,
  onChange,
  disabled,
  filledClass = "bg-primary border-primary",
  emptyClass = "bg-primary/10 border-primary/20",
  size = "md",
}: SheetDotRatingProps) {
  const handleClick = (dot: number) => {
    if (disabled || !onChange) return;
    // Clicking the same filled dot clears down to dot-1
    onChange(dot === value ? dot - 1 : dot);
  };

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label="Rating dots">
      {Array.from({ length: max }, (_, i) => {
        const dot = i + 1;
        const filled = dot <= value;
        return (
          <button
            key={dot}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(dot)}
            className={cn(
              "rounded-full border-2 transition-all duration-150",
              sizes[size],
              filled ? filledClass : emptyClass,
              !disabled && "cursor-pointer hover:scale-110 active:scale-95",
              disabled && "cursor-default opacity-70"
            )}
            aria-label={`${dot} de ${max}`}
          />
        );
      })}
    </div>
  );
}
