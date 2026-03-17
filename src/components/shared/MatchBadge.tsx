import { cn } from "@/lib/utils";

interface MatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MatchBadge({ score, size = "md", className }: MatchBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "match-badge inline-flex items-center gap-1 font-display font-bold",
        sizeClasses[size],
        className
      )}
    >
      {score}%
    </span>
  );
}
