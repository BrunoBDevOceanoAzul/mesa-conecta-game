import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewCard } from "./ReviewCard";
import { ReputationBadge } from "./ReputationBadge";
import { Star, MessageSquareText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewsListProps {
  reviewedUserId?: string;
  reviewedTableId?: string;
  reviewType?: string;
  limit?: number;
  showHeader?: boolean;
  showReputation?: boolean;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  review_type: string;
  is_verified: boolean;
  created_at: string;
  reviewer_user_id: string;
  reviewer_name?: string;
}

export function ReviewsList({
  reviewedUserId,
  reviewedTableId,
  reviewType,
  limit = 10,
  showHeader = true,
  showReputation = true,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [reviewedUserId, reviewedTableId, reviewType]);

  async function loadReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (reviewedUserId) query = query.eq("reviewed_user_id", reviewedUserId);
    if (reviewedTableId) query = query.eq("reviewed_table_id", reviewedTableId);
    if (reviewType) query = query.eq("review_type", reviewType);

    const { data } = await query;
    
    if (data && data.length > 0) {
      // Fetch reviewer names
      const reviewerIds = [...new Set((data as any[]).map((r: any) => r.reviewer_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, display_name")
        .in("user_id", reviewerIds);

      const nameMap = new Map<string, string>();
      (profiles || []).forEach((p: any) => nameMap.set(p.user_id, p.display_name || p.name || "Jogador"));

      setReviews(
        (data as any[]).map((r: any) => ({
          ...r,
          reviewer_name: nameMap.get(r.reviewer_user_id) || "Jogador",
        }))
      );
    } else {
      setReviews([]);
    }
    setLoading(false);
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-display font-semibold text-foreground">
            <Star className="h-5 w-5 text-secondary" />
            Avaliações
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
            )}
          </h3>
          {showReputation && reviews.length > 0 && (
            <ReputationBadge rating={avgRating} totalReviews={reviews.length} size="sm" />
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <MessageSquareText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Ainda sem avaliações</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Seja o primeiro a avaliar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              reviewerName={review.reviewer_name || "Jogador"}
              rating={review.rating}
              comment={review.comment}
              createdAt={review.created_at}
              isVerified={review.is_verified}
              reviewType={review.review_type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
