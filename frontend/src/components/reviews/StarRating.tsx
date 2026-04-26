import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-all duration-150",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
              filled ? "text-secondary" : "text-muted-foreground/30"
            )}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <Star className={cn(sizeMap[size], filled && "fill-current")} />
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-display font-bold text-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
