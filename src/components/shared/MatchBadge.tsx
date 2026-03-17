import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface MatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function MatchBadge({ score, size = "md", className, showIcon = true }: MatchBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-3 py-1 gap-1.5",
    lg: "text-sm px-4 py-1.5 gap-1.5",
  };

  const iconSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "match-badge inline-flex items-center font-display font-bold",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Sparkles className={iconSize[size]} />}
      {score}%
    </span>
  );
}
