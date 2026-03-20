import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Puzzle, Star, Users, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Expansion {
  id: string;
  name: string;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
}

interface BoardGameExpansionsProps {
  gameName: string;
}

export function BoardGameExpansions({ gameName }: BoardGameExpansionsProps) {
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameName) return;

    const search = async () => {
      // Search for expansions related to the base game
      const { data } = await supabase.rpc("search_board_games", {
        search_query: gameName,
        game_type_filter: "expansion",
        result_limit: 20,
      });
      setExpansions((data as Expansion[]) || []);
      setLoading(false);
    };

    search();
  }, [gameName]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Buscando expansões...</span>
        </div>
      </div>
    );
  }

  if (expansions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Puzzle className="h-4 w-4" />
        Expansões disponíveis ({expansions.length})
      </h2>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {expansions.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
          >
            {exp.thumbnail_url ? (
              <img src={exp.thumbnail_url} alt={exp.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Puzzle className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{exp.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                {exp.min_players != null && exp.max_players != null && (
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />{exp.min_players}-{exp.max_players}
                  </span>
                )}
                {exp.playing_time != null && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />{exp.playing_time}min
                  </span>
                )}
                {exp.bgg_rating != null && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3" />{exp.bgg_rating.toFixed(1)}
                  </span>
                )}
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/50 text-amber-600">
                  Expansão
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
