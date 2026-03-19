import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Gamepad2, Users, Clock, Star, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface BoardGame {
  id: string;
  name: string;
  slug: string;
  type: string;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
  weight_complexity: number | null;
  is_available: boolean;
  similarity_score: number;
}

interface BoardGameSearchProps {
  onSelect: (game: BoardGame) => void;
  showExpansions?: boolean;
  placeholder?: string;
}

export function BoardGameSearch({
  onSelect,
  showExpansions = false,
  placeholder = "Buscar jogo de tabuleiro...",
}: BoardGameSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BoardGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<BoardGame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("search_board_games", {
        search_query: q.trim(),
        game_type_filter: showExpansions ? null : "game",
        result_limit: 10,
      });
      if (!error && data) {
        setResults(data as BoardGame[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [showExpansions]);

  const handleChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  };

  const handleSelect = (game: BoardGame) => {
    setSelected(game);
    setQuery(game.name);
    setFocused(false);
    setResults([]);
    onSelect(game);
  };

  const clear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
    inputRef.current?.focus();
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case "game": return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Jogo</Badge>;
      case "expansion": return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600">Expansão</Badge>;
      case "accessory": return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Acessório</Badge>;
      case "rpg": return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">RPG</Badge>;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected preview */}
      {selected && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
          {selected.thumbnail_url && (
            <img src={selected.thumbnail_url} alt="" className="h-10 w-10 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selected.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {selected.min_players && selected.max_players && (
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{selected.min_players}-{selected.max_players}</span>
              )}
              {selected.playing_time && (
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{selected.playing_time}min</span>
              )}
              {typeBadge(selected.type)}
            </div>
          </div>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && !selected && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {focused && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : results.length > 0 ? (
            <div className="p-1.5">
              {results.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleSelect(game)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {game.thumbnail_url ? (
                    <img src={game.thumbnail_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{game.name}</span>
                      {typeBadge(game.type)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      {game.min_players != null && game.max_players != null && (
                        <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{game.min_players}-{game.max_players} jogadores</span>
                      )}
                      {game.playing_time != null && (
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{game.playing_time}min</span>
                      )}
                      {game.bgg_rating != null && (
                        <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{game.bgg_rating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  {game.type === "expansion" && (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum jogo encontrado para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
