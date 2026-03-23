import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { calculateMatchScore, getMatchLabel, getMatchColor } from "@/lib/match-scoring";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShareButton } from "@/components/shared/ShareModal";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewFormModal } from "@/components/reviews/ReviewFormModal";
import { StartChatButton } from "@/components/chat/StartChatButton";
import { useReviewEligibility } from "@/hooks/use-reviews";
import { PlayerPreparationBlock } from "@/components/mesa/PlayerPreparationBlock";
import { PreparationSetupPanel } from "@/components/mesa/PreparationSetupPanel";
import { MesaLiveChat } from "@/components/mesa/MesaLiveChat";
import { GMSubmissionsTracker } from "@/components/mesa/GMSubmissionsTracker";
import { BookingFlowDialog } from "@/components/mesa/BookingFlowDialog";
import { MesaParticipants } from "@/components/mesa/MesaParticipants";
import { MesaFeed } from "@/components/mesa/MesaFeed";
import { BoardGameExpansions } from "@/components/mesa/BoardGameExpansions";
import {
  MapPin, Calendar, Clock, Users, Sparkles, ArrowLeft, Tag,
  Loader2, User, Monitor, Home, RefreshCw, Star, Timer, Check
} from "lucide-react";

type Mesa = {
  id: string;
  title: string;
  description: string | null;
  system: string;
  session_type: string;
  format: string;
  city: string | null;
  venue: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_id: string;
  gm_name: string;
  start_at: string;
  end_at: string | null;
  status: string;
  tags: string[] | null;
  play_styles: string[] | null;
  image_url: string | null;
  cover_image_url: string | null;
  mesa_type: string;
  board_game_id: string | null;
};

const formatIcons: Record<string, typeof Monitor> = {
  presencial: Home,
  online: Monitor,
  "híbrido": RefreshCw,
};

const sessionLabels: Record<string, string> = {
  "one-shot": "One-Shot",
  campanha: "Campanha",
  evento: "Evento",
};

function getDurationLabel(startAt: string, endAt?: string | null): string | null {
  if (!endAt) return null;
  const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
}

export default function TableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [existingBooking, setExistingBooking] = useState(false);
  const eligibility = useReviewEligibility(id);
...
              ) : mesa.status === "aberta" && mesa.seats_available > 0 ? (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full text-base"
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    setBookingOpen(true);
                  }}
                >
                  {mesa.min_price > 0
                    ? `Reservar — R$ ${mesa.min_price.toFixed(2).replace(".", ",")}`
                    : "Reservar Vaga — Grátis"}
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="w-full" disabled>
                  {mesa.seats_available === 0 ? "Mesa Lotada" : "Mesa Encerrada"}
                </Button>
              )}

              {!existingBooking && mesa.min_price > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Pagamento seguro via PIX • sem surpresas
                </p>
              )}

              {/* Chat with GM */}
              <StartChatButton
                targetUserId={mesa.gm_id}
                targetName={mesa.gm_name}
                conversationType="gm_player"
                relatedTableId={mesa.id}
                subject={`Conversa sobre: ${mesa.title}`}
                variant="outline"
                size="default"
                label="Falar com o mestre"
                otherRoleLabel="gm"
                myRoleLabel="player"
                className="w-full"
              />

              {/* Share button */}
              <ShareButton entityType="mesa" entityId={mesa.id} entityTitle={mesa.title} />
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {eligibility.bookingId && mesa && (
        <ReviewFormModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          bookingId={eligibility.bookingId}
          reviewedUserId={eligibility.gmUserId || undefined}
          reviewedTableId={id}
          reviewType="table"
          targetName={mesa.title}
        />
      )}
      {/* Booking Flow Dialog */}
      {mesa && (
        <BookingFlowDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          mesa={{
            id: mesa.id,
            title: mesa.title,
            gm_id: mesa.gm_id,
            gm_name: mesa.gm_name,
            min_price: mesa.min_price,
            seats_available: mesa.seats_available,
            seats_total: mesa.seats_total,
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        {icon}
      </div>
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}
