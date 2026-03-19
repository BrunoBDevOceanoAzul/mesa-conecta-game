import { useState } from "react";
import { usePendingReviews } from "@/hooks/use-reviews";
import { ReviewFormModal } from "./ReviewFormModal";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight, X } from "lucide-react";

export function PendingReviewsBanner() {
  const { targets, loading, reload } = usePendingReviews();
  const [dismissed, setDismissed] = useState(false);
  const [reviewState, setReviewState] = useState<{
    open: boolean;
    bookingId: string;
    reviewedUserId?: string;
    reviewedTableId?: string;
    reviewedStoreId?: string;
    reviewType: "gm" | "table" | "store";
    targetName: string;
  } | null>(null);

  if (loading || dismissed || targets.length === 0) return null;

  const first = targets[0];

  // Determine which review to prompt
  let promptType: "table" | "gm" | "store" = "table";
  let promptLabel = `a mesa "${first.tableTitle}"`;
  if (first.tableReviewed && !first.gmReviewed) {
    promptType = "gm";
    promptLabel = "o mestre da sessão";
  } else if (first.tableReviewed && first.gmReviewed && first.storeUserId && !first.storeReviewed) {
    promptType = "store";
    promptLabel = "a loja/luderia";
  }

  function openReview() {
    setReviewState({
      open: true,
      bookingId: first.bookingId,
      reviewedUserId: promptType === "gm" ? first.gmUserId : undefined,
      reviewedTableId: promptType === "table" ? first.tableId : undefined,
      reviewedStoreId: promptType === "store" ? (first.storeUserId || undefined) : undefined,
      reviewType: promptType,
      targetName: first.tableTitle,
    });
  }

  return (
    <>
      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
          <Star className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Como foi sua experiência?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avalie {promptLabel} e ajude a comunidade.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1 text-xs border-secondary/30 text-secondary hover:bg-secondary/10"
          onClick={openReview}
        >
          Avaliar <ChevronRight className="h-3 w-3" />
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {reviewState && (
        <ReviewFormModal
          open={reviewState.open}
          onOpenChange={(open) => {
            if (!open) {
              setReviewState(null);
              reload();
            }
          }}
          bookingId={reviewState.bookingId}
          reviewedUserId={reviewState.reviewedUserId}
          reviewedTableId={reviewState.reviewedTableId}
          reviewedStoreId={reviewState.reviewedStoreId}
          reviewType={reviewState.reviewType}
          targetName={reviewState.targetName}
          onSuccess={reload}
        />
      )}
    </>
  );
}
