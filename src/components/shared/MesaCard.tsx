import { MapPin, Calendar, Users, Clock, Sparkles, Timer, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMatchColor, getMatchLabel } from "@/lib/match-scoring";

interface Mesa {
  id: string;
  title: string;
  system: string;
  session_type: string;
  format: string;
  city?: string | null;
  venue?: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_name: string;
  gm_instagram?: string | null;
  start_at: string;
  end_at?: string | null;
  status: string;
  tags?: string[];
  image_url?: string | null;
  cover_image_url?: string | null;
}

interface MesaCardProps {
  mesa: Mesa;
  matchScore?: number;
  sponsored?: boolean;
  founderBenefit?: boolean;
}

const formatMap: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
  híbrido: "Híbrido",
};

const sessionMap: Record<string, string> = {
  "one-shot": "One-Shot",
  campanha: "Campanha",
  evento: "Evento",
};

function formatTimeRange(startAt: string, endAt?: string | null): string {
  const start = new Date(startAt);
  const startTime = start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (!endAt) return startTime;
  const end = new Date(endAt);
  const endTime = end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${startTime} → ${endTime}`;
}

function getDurationLabel(startAt: string, endAt?: string | null): string | null {
  if (!endAt) return null;
  const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return h > 0 ? `${h}h${m > 0 ? `${m}` : ""}` : `${m}min`;
}

export function MesaCard({ mesa, matchScore, sponsored, founderBenefit }: MesaCardProps) {
  const navigate = useNavigate();
  const date = new Date(mesa.start_at);
  const formattedDate = date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const timeRange = formatTimeRange(mesa.start_at, mesa.end_at);
  const duration = getDurationLabel(mesa.start_at, mesa.end_at);
  const gradientClass = matchScore ? getMatchColor(matchScore) : "";
  const matchLabel = matchScore ? getMatchLabel(matchScore) : "";
  const coverUrl = mesa.cover_image_url || mesa.image_url;

  return (
    <div
      onClick={() => navigate(`/mesa/${mesa.id}`)}
      className={`group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        sponsored ? "border-gold-200 shadow-glow-gold" : "border-border hover:border-plum-200"
      }`}
    >
      {/* Cover Image or Fallback */}
      <div className="relative h-36 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={mesa.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full" style={{ backgroundImage: "var(--gradient-discovery)", opacity: 0.15 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl opacity-30">🎲</span>
            </div>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Sponsored / Founder badges */}
        {sponsored && (
          <div className="absolute top-0 left-0 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-br-xl" style={{ backgroundImage: "var(--gradient-gold)" }}>
              <Sparkles className="h-3 w-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {founderBenefit ? "Founder" : "Destaque"}
              </span>
            </div>
          </div>
        )}

        {/* Match score ribbon */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="absolute top-0 right-0 z-10">
            <div className={`bg-gradient-to-r ${gradientClass} px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5`}>
              <Sparkles className="h-3 w-3 text-white" />
              <span className="text-sm font-display font-bold text-white">{matchScore}%</span>
            </div>
          </div>
        )}

        {/* Time badge on image */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-lg px-2.5 py-1 text-xs font-semibold">
            <Clock className="h-3 w-3" />
            {timeRange}
          </div>
          {duration && (
            <div className="flex items-center gap-1 bg-plum-600/80 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-[10px] font-bold">
              <Timer className="h-2.5 w-2.5" />
              {duration}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags row */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="rounded-md bg-plum-50 px-2.5 py-0.5 text-xs font-semibold text-plum-500">
            {mesa.system}
          </span>
          <span className="rounded-md bg-teal-50 px-2.5 py-0.5 text-xs text-teal-600 font-medium">
            {sessionMap[mesa.session_type] || mesa.session_type}
          </span>
          {mesa.status === "aberta" && mesa.seats_available <= 2 && (
            <span className="rounded-md bg-coral-50 px-2.5 py-0.5 text-xs font-semibold text-coral-500">
              Últimas vagas
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-h4 text-foreground group-hover:text-plum-500 transition-colors mb-1 line-clamp-1">
          {mesa.title}
        </h3>

        {/* Match label */}
        {matchScore !== undefined && matchScore >= 55 && (
          <p className="text-xs font-medium text-plum-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {matchLabel}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-teal-300" />
            {formattedDate}
          </span>
          {mesa.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-coral-300" />
              <span className="truncate max-w-[100px]">{mesa.city}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 shrink-0 text-gold-300" />
            {mesa.seats_available}/{mesa.seats_total}
          </span>
        </div>

        {/* Footer: GM + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-plum-50 flex items-center justify-center text-xs font-bold text-plum-500 ring-1 ring-plum-200">
              {mesa.gm_name.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-medium text-foreground block leading-tight">{mesa.gm_name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{formatMap[mesa.format] || mesa.format}</span>
                {mesa.gm_instagram && (
                  <a
                    href={`https://www.instagram.com/${mesa.gm_instagram}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-display font-bold text-gold-500">
              R${mesa.min_price}
              {mesa.max_price > mesa.min_price && (
                <span className="text-sm font-normal text-muted-foreground">–{mesa.max_price}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
