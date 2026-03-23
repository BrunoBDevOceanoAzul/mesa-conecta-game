import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Hourglass, Dices, EyeOff } from "lucide-react";

interface RevealedAsset {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  category: string;
}

interface PublicRoll {
  id: string;
  user_name: string | null;
  roll_formula: string;
  total_result: number;
  created_at: string;
}

interface Props {
  mesaId: string;
}

export function PlayerSessionView({ mesaId }: Props) {
  const [revealedImages, setRevealedImages] = useState<RevealedAsset[]>([]);
  const [recentRolls, setRecentRolls] = useState<PublicRoll[]>([]);
  const [currentImage, setCurrentImage] = useState<RevealedAsset | null>(null);

  useEffect(() => {
    fetchRevealed();
    fetchRolls();

    // Realtime for asset reveals
    const assetChannel = supabase
      .channel(`player-assets-${mesaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "session_assets", filter: `game_table_id=eq.${mesaId}` }, () => {
        fetchRevealed();
      })
      .subscribe();

    // Realtime for dice rolls
    const diceChannel = supabase
      .channel(`player-dice-${mesaId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dice_rolls", filter: `game_table_id=eq.${mesaId}` }, (payload) => {
        const row = payload.new as any;
        if (row.visibility === "public") {
          setRecentRolls((prev) => [row, ...prev].slice(0, 20));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assetChannel);
      supabase.removeChannel(diceChannel);
    };
  }, [mesaId]);

  async function fetchRevealed() {
    const { data } = await supabase
      .from("session_assets")
      .select("id, title, description, file_url, category")
      .eq("game_table_id", mesaId)
      .eq("asset_type", "image")
      .eq("visibility_status", "revealed")
      .order("updated_at", { ascending: false });
    const items = (data as RevealedAsset[]) || [];
    setRevealedImages(items);
    setCurrentImage(items[0] || null);
  }

  async function fetchRolls() {
    const { data } = await supabase
      .from("dice_rolls")
      .select("id, user_name, roll_formula, total_result, created_at")
      .eq("game_table_id", mesaId)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20);
    setRecentRolls((data as PublicRoll[]) || []);
  }

  return (
    <div className="space-y-6">
      {/* Current revealed image */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {currentImage?.file_url ? (
          <div className="relative">
            <img
              src={currentImage.file_url}
              alt={currentImage.title}
              className="w-full max-h-[50vh] object-contain bg-black/90"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h3 className="text-white font-semibold text-lg">{currentImage.title}</h3>
              {currentImage.description && (
                <p className="text-white/80 text-sm mt-1">{currentImage.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Hourglass className="h-12 w-12 mb-3 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">Aguardando próximo momento…</p>
            <p className="text-xs mt-1">O mestre revelará conteúdo durante a sessão.</p>
          </div>
        )}
      </div>

      {/* Image gallery (if multiple revealed) */}
      {revealedImages.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Imagens Reveladas</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {revealedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setCurrentImage(img)}
                className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  currentImage?.id === img.id ? "border-primary" : "border-transparent"
                }`}
              >
                {img.file_url ? (
                  <img src={img.file_url} alt={img.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Image className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent public dice rolls */}
      {recentRolls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Dices className="h-3.5 w-3.5" /> Rolagens Recentes
          </h4>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {recentRolls.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.user_name}</span>
                    <Badge variant="outline" className="text-[10px]">{r.roll_formula}</Badge>
                  </div>
                  <span className="font-bold text-primary text-sm">{r.total_result}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
