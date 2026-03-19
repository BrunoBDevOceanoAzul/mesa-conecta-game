import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ReviewFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  reviewedUserId?: string;
  reviewedTableId?: string;
  reviewedStoreId?: string;
  reviewType: "gm" | "table" | "store";
  targetName: string;
  onSuccess?: () => void;
}

export function ReviewFormModal({
  open,
  onOpenChange,
  bookingId,
  reviewedUserId,
  reviewedTableId,
  reviewedStoreId,
  reviewType,
  targetName,
  onSuccess,
}: ReviewFormModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      reviewer_user_id: user.id,
      reviewed_user_id: reviewedUserId || null,
      reviewed_table_id: reviewedTableId || null,
      reviewed_store_id: reviewedStoreId || null,
      rating,
      comment: comment.trim() || null,
      review_type: reviewType,
      status: "published",
      is_verified: true,
    } as any);

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já avaliou esta sessão.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao enviar avaliação.", description: error.message, variant: "destructive" });
      }
      return;
    }

    setSubmitted(true);
    toast({ title: "Avaliação enviada!", description: "Sua opinião fortalece a comunidade." });
    onSuccess?.();
    setTimeout(() => {
      onOpenChange(false);
      setSubmitted(false);
      setRating(0);
      setComment("");
    }, 1500);
  };

  const typeLabels: Record<string, string> = {
    gm: "o mestre",
    table: "a mesa",
    store: "a loja",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-display font-bold text-foreground">Avaliação enviada!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sua opinião ajuda a fortalecer a comunidade.
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-display">
                Como foi sua experiência?
              </DialogTitle>
              <DialogDescription>
                Avalie {typeLabels[reviewType] || "a experiência"}{" "}
                <span className="font-semibold text-foreground">{targetName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Stars */}
              <div className="text-center space-y-2">
                <StarRating value={rating} onChange={setRating} size="lg" />
                <p className="text-xs text-muted-foreground">
                  {rating === 0 && "Toque para avaliar"}
                  {rating === 1 && "Ruim"}
                  {rating === 2 && "Regular"}
                  {rating === 3 && "Boa"}
                  {rating === 4 && "Muito boa"}
                  {rating === 5 && "Excelente!"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Comentário <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Textarea
                  placeholder="Conte como foi a experiência..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  rows={3}
                />
                <p className="text-[11px] text-muted-foreground text-right">{comment.length}/500</p>
              </div>

              <Button
                variant="hero"
                className="w-full"
                disabled={rating === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  "Enviar avaliação"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Baseado em participação real · Avaliação verificada
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
