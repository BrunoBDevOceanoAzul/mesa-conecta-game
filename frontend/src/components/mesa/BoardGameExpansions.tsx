import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Puzzle, Star, Users, Clock, Loader2, Plus, Check, X, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  mesaId: string;
  gmId: string;
}

export function BoardGameExpansions({ gameName, mesaId, gmId }: BoardGameExpansionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const isOwner = user?.id === gmId;

  const fetchSelected = useCallback(async () => {
    const { data } = await supabase
      .from("mesa_selected_expansions")
      .select("expansion_id")
      .eq("mesa_id", mesaId);
    setSelectedIds(new Set((data || []).map((r: any) => r.expansion_id)));
  }, [mesaId]);

  useEffect(() => {
    if (!gameName) return;

    const load = async () => {
      const [expansionsRes] = await Promise.all([
        supabase.rpc("search_board_games", {
          search_query: gameName,
          game_type_filter: "expansion",
          result_limit: 20,
        }),
        fetchSelected(),
      ]);
      setExpansions((expansionsRes.data as Expansion[]) || []);
      setLoading(false);
    };

    load();
  }, [gameName, fetchSelected]);

  const toggleExpansion = async (expansionId: string) => {
    if (!user) return;
    setSaving(expansionId);
    try {
      if (selectedIds.has(expansionId)) {
        await supabase
          .from("mesa_selected_expansions")
          .delete()
          .eq("mesa_id", mesaId)
          .eq("expansion_id", expansionId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(expansionId);
          return next;
        });
      } else {
        await supabase.from("mesa_selected_expansions").insert({
          mesa_id: mesaId,
          expansion_id: expansionId,
          added_by_user_id: user.id,
        });
        setSelectedIds((prev) => new Set(prev).add(expansionId));
      }
    } catch {
      toast({ title: "Erro ao atualizar expansão", variant: "destructive" });
    }
    setSaving(null);
  };

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

  const selectedExpansions = expansions.filter((e) => selectedIds.has(e.id));
  const availableExpansions = expansions.filter((e) => !selectedIds.has(e.id));

  return (
    <div className="space-y-4">
      {/* Selected expansions — always visible when there are selections */}
      {selectedExpansions.length > 0 && (
        <div className="rounded-2xl border border-plum-200 bg-gradient-to-r from-plum-50/50 to-gold-50/30 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4 text-plum-500" />
            Expansões desta sessão ({selectedExpansions.length})
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {selectedExpansions.map((exp) => (
              <ExpansionCard
                key={exp.id}
                expansion={exp}
                isSelected
                isOwner={isOwner}
                isSaving={saving === exp.id}
                onToggle={() => toggleExpansion(exp.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available expansions — owner always sees, visitors only if no selection made */}
      {(isOwner || selectedExpansions.length === 0) && availableExpansions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Puzzle className="h-4 w-4" />
            {isOwner ? "Expansões disponíveis" : "Expansões disponíveis"} ({availableExpansions.length})
          </h2>
          {isOwner && (
            <p className="text-xs text-muted-foreground -mt-2">
              Clique para adicionar as expansões que serão usadas nesta sessão.
            </p>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {availableExpansions.map((exp) => (
              <ExpansionCard
                key={exp.id}
                expansion={exp}
                isSelected={false}
                isOwner={isOwner}
                isSaving={saving === exp.id}
                onToggle={() => toggleExpansion(exp.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpansionCard({
  expansion,
  isSelected,
  isOwner,
  isSaving,
  onToggle,
}: {
  expansion: Expansion;
  isSelected: boolean;
  isOwner: boolean;
  isSaving: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isSelected
          ? "border-plum-300 bg-plum-50/50"
          : "border-border bg-muted/20 hover:bg-muted/40"
      } ${isOwner ? "cursor-pointer" : ""}`}
      onClick={isOwner ? onToggle : undefined}
      role={isOwner ? "button" : undefined}
      tabIndex={isOwner ? 0 : undefined}
    >
      {expansion.thumbnail_url ? (
        <img
          src={expansion.thumbnail_url}
          alt={expansion.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{expansion.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
          {expansion.min_players != null && expansion.max_players != null && (
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {expansion.min_players}-{expansion.max_players}
            </span>
          )}
          {expansion.playing_time != null && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {expansion.playing_time}min
            </span>
          )}
          {expansion.bgg_rating != null && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3" />
              {expansion.bgg_rating.toFixed(1)}
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 border-amber-500/50 text-amber-600"
          >
            Expansão
          </Badge>
        </div>
      </div>

      {isOwner && (
        <div className="shrink-0">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isSelected ? (
            <div className="h-7 w-7 rounded-full bg-plum-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-plum-400 transition-colors">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {!isOwner && isSelected && (
        <div className="shrink-0">
          <div className="h-7 w-7 rounded-full bg-plum-500/10 flex items-center justify-center">
            <Check className="h-4 w-4 text-plum-500" />
          </div>
        </div>
      )}
    </div>
  );
}
