import { Star, Award, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReputationBadgeProps {
  rating: number;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getReputationLabel(rating: number): string {
  if (rating >= 4.8) return "Excepcional";
  if (rating >= 4.5) return "Excelente";
  if (rating >= 4.0) return "Muito Bom";
  if (rating >= 3.5) return "Bom";
  if (rating >= 3.0) return "Regular";
  return "Em avaliação";
}

function getReputationColor(rating: number): string {
  if (rating >= 4.5) return "border-secondary/40 bg-secondary/10 text-secondary";
  if (rating >= 4.0) return "border-primary/30 bg-primary/10 text-primary";
  if (rating >= 3.0) return "border-border bg-muted text-foreground";
  return "border-border bg-muted text-muted-foreground";
}

export function ReputationBadge({ rating, totalReviews, size = "md", className }: ReputationBadgeProps) {
  if (totalReviews === 0) return null;

  const label = getReputationLabel(rating);
  const colorClass = getReputationColor(rating);

  if (size === "sm") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1", colorClass, className)}>
        <Star className="h-3 w-3 fill-current" />
        <span className="text-xs font-bold">{rating.toFixed(1)}</span>
        <span className="text-[10px] opacity-70">({totalReviews})</span>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={cn("rounded-xl border p-4 text-center space-y-1", colorClass, className)}>
        <div className="flex items-center justify-center gap-1">
          {rating >= 4.5 && <Sparkles className="h-5 w-5" />}
          <span className="text-3xl font-display font-bold">{rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={cn("h-4 w-4", s <= Math.round(rating) ? "fill-current" : "opacity-30")} />
          ))}
        </div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] opacity-70">{totalReviews} avaliação{totalReviews !== 1 ? "ões" : ""}</p>
      </div>
    );
  }

  // md
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2", colorClass, className)}>
      <Award className="h-4 w-4" />
      <span className="text-sm font-display font-bold">{rating.toFixed(1)}</span>
      <span className="text-xs opacity-70">· {label} ({totalReviews})</span>
    </div>
  );
}
