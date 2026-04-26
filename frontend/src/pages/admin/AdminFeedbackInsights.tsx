import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Star, Users, TrendingUp, MessageCircle, ThumbsUp,
  ThumbsDown, AlertTriangle, ArrowUp, ArrowDown
} from "lucide-react";

interface FeedbackInsight {
  total_feedback: number;
  avg_overall: number;
  avg_engagement: number;
  avg_communication: number;
  avg_punctuality: number;
  avg_creativity: number;
  would_play_again_pct: number;
  top_gms: { user_id: string; name: string; avg_rating: number; count: number }[];
  improvement_themes: { theme: string; count: number }[];
  npc_favorites: { npc_name: string; mentions: number }[];
  player_preparedness_avg: number;
}

export default function AdminFeedbackInsights() {
  const [insights, setInsights] = useState<FeedbackInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    // Fetch all feedback
    const { data: feedback } = await (supabase as any)
      .from("session_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (!feedback?.length) {
      setLoading(false);
      return;
    }

    setRecentFeedback(feedback.slice(0, 20));

    const playerReviews = feedback.filter((f: any) => f.review_type === "player_reviews_gm");
    const gmReviews = feedback.filter((f: any) => f.review_type === "gm_reviews_player");

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const nonNull = (arr: any[], field: string) => arr.map((f) => f[field]).filter((v: any) => v != null);

    // Top GMs by rating
    const gmRatings: Record<string, { total: number; count: number }> = {};
    playerReviews.forEach((f: any) => {
      if (!gmRatings[f.reviewed_user_id]) gmRatings[f.reviewed_user_id] = { total: 0, count: 0 };
      gmRatings[f.reviewed_user_id].total += f.overall_rating;
      gmRatings[f.reviewed_user_id].count++;
    });

    // Get GM names
    const gmIds = Object.keys(gmRatings);
    let topGms: any[] = [];
    if (gmIds.length) {
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, name")
        .in("user_id", gmIds);

      topGms = gmIds
        .map((id) => ({
          user_id: id,
          name: profiles?.find((p: any) => p.user_id === id)?.name || "Desconhecido",
          avg_rating: gmRatings[id].total / gmRatings[id].count,
          count: gmRatings[id].count,
        }))
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);
    }

    // NPC favorites
    const npcMentions: Record<string, number> = {};
    playerReviews.forEach((f: any) => {
      if (f.favorite_npc) {
        const key = f.favorite_npc.trim().toLowerCase();
        npcMentions[key] = (npcMentions[key] || 0) + 1;
      }
    });
    const npcFavorites = Object.entries(npcMentions)
      .map(([npc_name, mentions]) => ({ npc_name, mentions }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    // Would play again
    const playAgainResponses = playerReviews.filter((f: any) => f.would_play_again != null);
    const wouldPlayAgainPct = playAgainResponses.length
      ? (playAgainResponses.filter((f: any) => f.would_play_again).length / playAgainResponses.length) * 100
      : 0;

    setInsights({
      total_feedback: feedback.length,
      avg_overall: avg(nonNull(playerReviews, "overall_rating")),
      avg_engagement: avg(nonNull(playerReviews, "engagement_rating")),
      avg_communication: avg(nonNull(playerReviews, "communication_rating")),
      avg_punctuality: avg(nonNull(playerReviews, "punctuality_rating")),
      avg_creativity: avg(nonNull(playerReviews, "creativity_rating")),
      would_play_again_pct: wouldPlayAgainPct,
      top_gms: topGms,
      improvement_themes: [],
      npc_favorites: npcFavorites,
      player_preparedness_avg: avg(nonNull(gmReviews, "player_preparedness")),
    });
    setLoading(false);
  };

  const ratingColor = (val: number) => {
    if (val >= 4) return "text-green-500";
    if (val >= 3) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Insights de Feedback</h1>
            <p className="text-sm text-muted-foreground">Dados de avaliação bidirecional GM ↔ Jogadores</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando insights...</p>
        ) : !insights ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum feedback registrado ainda.</p>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{insights.total_feedback}</p>
                <p className="text-xs text-muted-foreground">Total de Feedbacks</p>
              </Card>
              <Card className="p-4 text-center">
                <p className={`text-2xl font-bold ${ratingColor(insights.avg_overall)}`}>
                  {insights.avg_overall.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Nota Média GM</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{insights.would_play_again_pct.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Jogaria de Novo</p>
              </Card>
              <Card className="p-4 text-center">
                <p className={`text-2xl font-bold ${ratingColor(insights.player_preparedness_avg)}`}>
                  {insights.player_preparedness_avg.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Preparação Jogadores</p>
              </Card>
            </div>

            {/* Rating Breakdown */}
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Breakdown de Notas (GM)</h3>
              {[
                { label: "Engajamento", val: insights.avg_engagement },
                { label: "Comunicação", val: insights.avg_communication },
                { label: "Pontualidade", val: insights.avg_punctuality },
                { label: "Criatividade", val: insights.avg_creativity },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(item.val / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${ratingColor(item.val)}`}>
                      {item.val.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </Card>

            {/* Top GMs */}
            {insights.top_gms.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400" /> Top Mestres
                </h3>
                {insights.top_gms.map((gm, i) => (
                  <div key={gm.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm text-foreground">{gm.name}</span>
                      <Badge variant="outline" className="text-[10px]">{gm.count} avaliações</Badge>
                    </div>
                    <span className={`text-sm font-bold ${ratingColor(gm.avg_rating)}`}>
                      {gm.avg_rating.toFixed(1)} ★
                    </span>
                  </div>
                ))}
              </Card>
            )}

            {/* NPC Favorites */}
            {insights.npc_favorites.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-primary" /> NPCs Mais Populares
                </h3>
                {insights.npc_favorites.map((npc) => (
                  <div key={npc.npc_name} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{npc.npc_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{npc.mentions} menções</Badge>
                  </div>
                ))}
              </Card>
            )}

            {/* Recent Feedback */}
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Últimos Feedbacks</h3>
              {recentFeedback.map((fb) => (
                <div key={fb.id} className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={fb.review_type === "player_reviews_gm" ? "default" : "secondary"} className="text-[10px]">
                      {fb.review_type === "player_reviews_gm" ? "Jogador → GM" : "GM → Jogador"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">{fb.overall_rating}</span>
                    </div>
                  </div>
                  {fb.highlights && <p className="text-xs text-foreground">{fb.highlights}</p>}
                  {fb.improvement_suggestions && (
                    <p className="text-xs text-muted-foreground italic">💡 {fb.improvement_suggestions}</p>
                  )}
                  {fb.favorite_npc && (
                    <p className="text-[10px] text-muted-foreground">NPC favorito: {fb.favorite_npc}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString("pt-BR")}
                    {fb.would_play_again != null && (
                      <> · {fb.would_play_again ? "✅ Jogaria de novo" : "❌ Não jogaria"}</>
                    )}
                  </p>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}