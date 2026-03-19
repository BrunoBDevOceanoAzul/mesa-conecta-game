import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock } from "lucide-react";

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  isVerified?: boolean;
  reviewType?: string;
}

export function ReviewCard({
  reviewerName,
  rating,
  comment,
  createdAt,
  isVerified = true,
  reviewType,
}: ReviewCardProps) {
  const date = new Date(createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/15 shrink-0">
            {reviewerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{reviewerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={rating} size="sm" readonly />
              {isVerified && (
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 gap-1 px-1.5 py-0">
                  <ShieldCheck className="h-2.5 w-2.5" /> Verificada
                </Badge>
              )}
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" /> {timeAgo}
        </span>
      </div>

      {comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">{comment}</p>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays}d atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m atrás`;
  return `${Math.floor(diffDays / 365)}a atrás`;
}
