import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { calculateMatchScore, getMatchLabel, getMatchColor } from "@/lib/match-scoring";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/shared/ShareModal";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewFormModal } from "@/components/reviews/ReviewFormModal";
import { StartChatButton } from "@/components/chat/StartChatButton";
import { useReviewEligibility } from "@/hooks/use-reviews";
import {
  MapPin, Calendar, Clock, Users, Sparkles, ArrowLeft, Tag,
  Loader2, User, Monitor, Home, RefreshCw, Star
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
  status: string;
  tags: string[] | null;
  play_styles: string[] | null;
  image_url: string | null;
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

export default function TableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const eligibility = useReviewEligibility(id);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("mesas")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data) setMesa(data as Mesa);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mesa) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Mesa não encontrada</h1>
          <p className="text-muted-foreground mb-6">Esta mesa não existe ou foi removida.</p>
          <Button variant="hero" onClick={() => navigate("/explorar")}>Explorar Mesas</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const matchScore = preferences
    ? calculateMatchScore(preferences, {
        city: mesa.city,
        system: mesa.system,
        format: mesa.format,
        min_price: mesa.min_price,
        max_price: mesa.max_price,
        play_styles: mesa.play_styles || [],
        session_type: mesa.session_type,
      })
    : null;

  const date = new Date(mesa.start_at);
  const FormatIcon = formatIcons[mesa.format] || Monitor;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {mesa.system}
                </span>
                <span className="rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground font-medium">
                  {sessionLabels[mesa.session_type] || mesa.session_type}
                </span>
                <span className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  mesa.status === "aberta" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                }`}>
                  {mesa.status.charAt(0).toUpperCase() + mesa.status.slice(1)}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                {mesa.title}
              </h1>

              {/* Match score badge */}
              {matchScore !== null && matchScore > 0 && (
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${getMatchColor(matchScore)} rounded-full px-4 py-2 mt-2`}>
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-display font-bold text-primary-foreground">
                    Combina {matchScore}% com você
                  </span>
                  <span className="text-xs text-primary-foreground/80">
                    · {getMatchLabel(matchScore)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {mesa.description && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sobre a mesa</h2>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{mesa.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem icon={<User className="h-5 w-5 text-primary" />} label="Mestre" value={mesa.gm_name} />
              <DetailItem icon={<FormatIcon className="h-5 w-5 text-primary" />} label="Formato" value={mesa.format.charAt(0).toUpperCase() + mesa.format.slice(1)} />
              {mesa.city && <DetailItem icon={<MapPin className="h-5 w-5 text-primary" />} label="Cidade" value={mesa.city} />}
              {mesa.venue && <DetailItem icon={<Home className="h-5 w-5 text-primary" />} label="Local" value={mesa.venue} />}
              <DetailItem icon={<Calendar className="h-5 w-5 text-primary" />} label="Data" value={date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
              <DetailItem icon={<Clock className="h-5 w-5 text-primary" />} label="Horário" value={date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} />
            </div>

            {/* Tags */}
            {mesa.tags && mesa.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {mesa.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
            </div>

            {/* Reviews section */}
            <div className="mt-8">
              {eligibility.eligible && (
                <Button
                  variant="hero"
                  size="sm"
                  className="mb-4 gap-2"
                  onClick={() => setReviewOpen(true)}
                >
                  <Star className="h-4 w-4" /> Avaliar esta mesa
                </Button>
              )}
              {eligibility.alreadyReviewed && (
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                  <Star className="h-3 w-3 text-secondary" /> Você já avaliou esta sessão
                </p>
              )}
              <ReviewsList reviewedTableId={id} reviewType="table" />
            </div>
          </div>
            )}
          </div>

          {/* Sidebar - Booking card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
              {/* Price */}
              <div className="text-center">
                <span className="text-3xl font-display font-bold text-foreground">
                  R${mesa.min_price}
                  {mesa.max_price > mesa.min_price && (
                    <span className="text-lg font-normal text-muted-foreground">–{mesa.max_price}</span>
                  )}
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">por sessão</p>
              </div>

              {/* Seats */}
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {mesa.seats_available} de {mesa.seats_total} vagas disponíveis
                </span>
              </div>

              {/* Seats bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((mesa.seats_total - mesa.seats_available) / mesa.seats_total) * 100}%`,
                    backgroundImage: "linear-gradient(135deg, hsl(280 52% 42%), hsl(38 88% 55%))",
                  }}
                />
              </div>

              {/* Match score mini */}
              {matchScore !== null && matchScore >= 55 && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-display font-bold">{matchScore}% compatível</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getMatchLabel(matchScore)}</p>
                </div>
              )}

              {/* Reserve button */}
              {mesa.status === "aberta" && mesa.seats_available > 0 ? (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full text-base"
                  onClick={() => navigate(`/checkout/${mesa.id}`)}
                >
                  Reservar Vaga
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="w-full" disabled>
                  {mesa.seats_available === 0 ? "Mesa Lotada" : "Mesa Encerrada"}
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                Pagamento simulado para MVP
              </p>

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
              <ShareButton
                entityType="mesa"
                entityId={mesa.id}
                entityTitle={mesa.title}
              />
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

      <Footer />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        {icon}
      </div>
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}
