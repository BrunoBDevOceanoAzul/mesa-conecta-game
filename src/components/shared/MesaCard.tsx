import { MapPin, Calendar, Users, Clock, Sparkles } from "lucide-react";
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
  start_at: string;
  status: string;
  tags?: string[];
  image_url?: string | null;
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

export function MesaCard({
  mesa,
  matchScore,
  sponsored,
  founderBenefit,
}: MesaCardProps) {
  const navigate = useNavigate();
  const date = new Date(mesa.start_at);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const gradientClass = matchScore ? getMatchColor(matchScore) : "";
  const matchLabel = matchScore ? getMatchLabel(matchScore) : "";

  return (
    <div
      onClick={() => navigate(`/mesa/${mesa.id}`)}
      className={`group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        sponsored ? "border-gold-200 shadow-glow-gold" : "border-border hover:border-plum-200"
      }`}
    >
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
          <div
            className={`bg-gradient-to-r ${gradientClass} px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5`}
          >
            <Sparkles className="h-3 w-3 text-white" />
            <span className="text-sm font-display font-bold text-white">
              {matchScore}%
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Tags row */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="rounded-md bg-plum-50 px-2.5 py-1 text-xs font-semibold text-plum-500">
            {mesa.system}
          </span>
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs text-teal-600 font-medium">
            {sessionMap[mesa.session_type] || mesa.session_type}
          </span>
          {mesa.status === "aberta" && mesa.seats_available <= 2 && (
            <span className="rounded-md bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-500">
              Últimas vagas
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-h4 text-foreground group-hover:text-plum-500 transition-colors mb-1.5 line-clamp-1">
          {mesa.title}
        </h3>

        {/* Match label */}
        {matchScore !== undefined && matchScore >= 55 && (
          <p className="text-xs font-medium text-plum-400 mb-3 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {matchLabel}
          </p>
        )}

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
          {mesa.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-coral-300" />
              <span className="truncate">{mesa.city}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-teal-300" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-plum-300" />
            {formattedTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-gold-300" />
            {mesa.seats_available}/{mesa.seats_total} vagas
          </span>
        </div>

        {/* Footer: GM + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-plum-50 flex items-center justify-center text-xs font-bold text-plum-500 ring-1 ring-plum-200">
              {mesa.gm_name.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-medium text-foreground block leading-tight">
                {mesa.gm_name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatMap[mesa.format] || mesa.format}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-display font-bold text-gold-500">
              R${mesa.min_price}
              {mesa.max_price > mesa.min_price && (
                <span className="text-sm font-normal text-muted-foreground">
                  –{mesa.max_price}
                </span>
              )}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              por sessão
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
