import type { Table } from "@/data/constants";
import { MatchBadge } from "./MatchBadge";
import { MapPin, Calendar, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TableCardProps {
  table: Table;
}

export function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  const date = new Date(table.startAt);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

  return (
    <div
      className="card-hover group relative rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-border-strong"
      onClick={() => navigate(`/mesa/${table.id}`)}
    >
      <div className="absolute top-4 right-4">
        <MatchBadge score={table.matchScore} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {table.system}
        </span>
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground font-medium">
          {sessionMap[table.sessionType]}
        </span>
      </div>

      <h3 className="mb-1 text-h4 text-foreground group-hover:text-primary transition-colors">
        {table.title}
      </h3>
      <p className="mb-3 text-body-sm text-muted-foreground line-clamp-2">
        {table.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {table.city}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formattedTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {table.seatsAvailable}/{table.seatsTotal} vagas
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-primary/15">
            {table.gmName.charAt(0)}
          </div>
          <span className="text-xs text-muted-foreground">{table.gmName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-semibold text-foreground">
            R${table.minPrice}
            {table.maxPrice !== table.minPrice && `–${table.maxPrice}`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatMap[table.format]}
          </span>
        </div>
      </div>
    </div>
  );
}
