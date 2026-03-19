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
import { PlayerPreparationBlock } from "@/components/mesa/PlayerPreparationBlock";
import { PreparationSetupPanel } from "@/components/mesa/PreparationSetupPanel";
import { MesaLiveChat } from "@/components/mesa/MesaLiveChat";
import { GMSubmissionsTracker } from "@/components/mesa/GMSubmissionsTracker";
import {
  MapPin, Calendar, Clock, Users, Sparkles, ArrowLeft, Tag,
  Loader2, User, Monitor, Home, RefreshCw, Star, Timer
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
      .then(({ data }) => {
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
  const coverUrl = mesa.cover_image_url || mesa.image_url;
  const duration = getDurationLabel(mesa.start_at, mesa.end_at);

  const startTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const endTime = mesa.end_at
    ? new Date(mesa.end_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Cover */}
      <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={mesa.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-plum-100 via-gold-50 to-coral-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-16 relative z-10 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-lg bg-plum-50 px-3 py-1 text-sm font-semibold text-plum-500">
                  {mesa.system}
                </span>
                <span className="rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground font-medium">
                  {sessionLabels[mesa.session_type] || mesa.session_type}
                </span>
                <span className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  mesa.status === "aberta" ? "bg-teal-50 text-teal-500" : "bg-muted text-muted-foreground"
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

            {/* Time highlight card */}
            <div className="rounded-2xl border border-plum-200 bg-gradient-to-r from-plum-50 to-gold-50 p-5">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-plum-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-plum-500" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Data</span>
                    <span className="text-sm font-semibold text-foreground">
                      {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-plum-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-plum-500" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Horário</span>
                    <span className="text-sm font-semibold text-foreground">
                      {startTime}{endTime ? ` → ${endTime}` : ""}
                    </span>
                  </div>
                </div>
                {duration && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gold-100 flex items-center justify-center">
                      <Timer className="h-5 w-5 text-gold-500" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Duração estimada</span>
                      <span className="text-sm font-semibold text-foreground">{duration}</span>
                    </div>
                  </div>
                )}
              </div>
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
              <DetailItem icon={<User className="h-5 w-5 text-plum-500" />} label="Mestre" value={mesa.gm_name} />
              <DetailItem icon={<FormatIcon className="h-5 w-5 text-teal-500" />} label="Formato" value={mesa.format.charAt(0).toUpperCase() + mesa.format.slice(1)} />
              {mesa.city && <DetailItem icon={<MapPin className="h-5 w-5 text-coral-400" />} label="Cidade" value={mesa.city} />}
              {mesa.venue && <DetailItem icon={<Home className="h-5 w-5 text-gold-500" />} label="Local" value={mesa.venue} />}
            </div>

            {/* Tags */}
            {mesa.tags && mesa.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {mesa.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preparation Block - Player View */}
            {user && user.id !== mesa.gm_id && (
              <PlayerPreparationBlock
                gameTableId={mesa.id}
                tableTitle={mesa.title}
                systemName={mesa.system}
              />
            )}

            {/* Preparation Setup - GM View */}
            {user && user.id === mesa.gm_id && (
              <div className="space-y-4">
                <PreparationSetupPanel
                  gameTableId={mesa.id}
                  systemName={mesa.system}
                  tableTitle={mesa.title}
                />
                <GMSubmissionsTracker
                  gameTableId={mesa.id}
                  tableTitle={mesa.title}
                />
              </div>
            )}


            <div className="mt-8">
              {eligibility.eligible && (
                <Button variant="hero" size="sm" className="mb-4 gap-2" onClick={() => setReviewOpen(true)}>
                  <Star className="h-4 w-4" /> Avaliar esta mesa
                </Button>
              )}
              {eligibility.alreadyReviewed && (
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                  <Star className="h-3 w-3 text-gold-400" /> Você já avaliou esta sessão
                </p>
              )}
              <ReviewsList reviewedTableId={id} reviewType="table" />
            </div>
          </div>

          {/* Sidebar - Booking card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
              {/* Price */}
              <div className="text-center">
                <span className="text-3xl font-display font-bold text-gold-500">
                  R${mesa.min_price}
                  {mesa.max_price > mesa.min_price && (
                    <span className="text-lg font-normal text-muted-foreground">–{mesa.max_price}</span>
                  )}
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">por sessão</p>
              </div>

              {/* Quick time info */}
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-plum-400" />
                  {startTime}{endTime ? ` → ${endTime}` : ""}
                </div>
                {duration && (
                  <p className="text-xs text-muted-foreground mt-1">Duração estimada: {duration}</p>
                )}
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
                    backgroundImage: "var(--gradient-xp)",
                  }}
                />
              </div>

              {/* Match score mini */}
              {matchScore !== null && matchScore >= 55 && (
                <div className="rounded-xl bg-plum-50 border border-plum-100 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-plum-500">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-display font-bold">{matchScore}% compatível</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getMatchLabel(matchScore)}</p>
                </div>
              )}

              {/* Reserve button */}
              {mesa.status === "aberta" && mesa.seats_available > 0 ? (
                <Button variant="hero" size="lg" className="w-full text-base" onClick={() => navigate(`/checkout/${mesa.id}`)}>
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
