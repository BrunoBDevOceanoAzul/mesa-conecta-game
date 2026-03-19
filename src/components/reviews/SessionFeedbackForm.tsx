import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, Send, Loader2, MessageCircle, ThumbsUp, Clock, Sparkles, Users
} from "lucide-react";

interface SessionFeedbackFormProps {
  gameTableId: string;
  sessionId?: string;
  reviewedUserId: string;
  reviewedUserName?: string;
  reviewType: "player_reviews_gm" | "gm_reviews_player";
  onSubmitted?: () => void;
  token?: string; // for email-based access
}

function StarRatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="transition-colors"
          >
            <Star
              className={`h-5 w-5 ${s <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SessionFeedbackForm({
  gameTableId, sessionId, reviewedUserId, reviewedUserName,
  reviewType, onSubmitted, token,
}: SessionFeedbackFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Ratings
  const [overall, setOverall] = useState(0);
  const [engagement, setEngagement] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [creativity, setCreativity] = useState(0);

  // Text fields
  const [highlights, setHighlights] = useState("");
  const [improvements, setImprovements] = useState("");
  const [wouldPlayAgain, setWouldPlayAgain] = useState<boolean | null>(null);

  // Player→GM NPC fields
  const [favoriteNpc, setFavoriteNpc] = useState("");
  const [npcImpressions, setNpcImpressions] = useState("");

  // GM→Player fields
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [preparedness, setPreparedness] = useState(0);

  const isPlayerReview = reviewType === "player_reviews_gm";

  const handleSubmit = async () => {
    if (!user || overall === 0) {
      toast({ title: "Preencha ao menos a nota geral", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("session_feedback").insert({
        game_table_id: gameTableId,
        table_session_id: sessionId || null,
        reviewer_user_id: user.id,
        reviewed_user_id: reviewedUserId,
        review_type: reviewType,
        overall_rating: overall,
        engagement_rating: engagement || null,
        communication_rating: communication || null,
        punctuality_rating: punctuality || null,
        creativity_rating: creativity || null,
        highlights: highlights || null,
        improvement_suggestions: improvements || null,
        would_play_again: wouldPlayAgain,
        favorite_npc: isPlayerReview ? favoriteNpc || null : null,
        npc_impressions: isPlayerReview ? npcImpressions || null : null,
        player_behavior_notes: !isPlayerReview ? behaviorNotes || null : null,
        player_preparedness: !isPlayerReview && preparedness > 0 ? preparedness : null,
      });
      if (error) throw error;

      // Update feedback email queue if token exists
      if (token) {
        await (supabase as any)
          .from("feedback_email_queue")
          .update({ status: "responded", responded_at: new Date().toISOString() })
          .eq("token", token);
      }

      toast({ title: "Feedback enviado! 🎯", description: "Obrigado por contribuir com a comunidade." });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: any) {
      toast({ title: "Erro ao enviar feedback", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <ThumbsUp className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="font-display font-semibold text-foreground">Feedback enviado!</h3>
        <p className="text-sm text-muted-foreground">Sua avaliação ajuda a melhorar a experiência de todos na HIVIUM.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          {isPlayerReview ? <Star className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
        </div>
        <div>
          <h3 className="text-sm font-display font-semibold text-foreground">
            {isPlayerReview ? "Avaliar o Mestre" : "Avaliar Jogador"}
          </h3>
          {reviewedUserName && (
            <p className="text-xs text-muted-foreground">{reviewedUserName}</p>
          )}
        </div>
      </div>

      {/* Overall Rating */}
      <StarRatingInput value={overall} onChange={setOverall} label="Nota Geral *" />

      {/* Specific Ratings */}
      <div className="grid grid-cols-2 gap-3">
        <StarRatingInput value={engagement} onChange={setEngagement} label="Engajamento" />
        <StarRatingInput value={communication} onChange={setCommunication} label="Comunicação" />
        <StarRatingInput value={punctuality} onChange={setPunctuality} label="Pontualidade" />
        <StarRatingInput value={creativity} onChange={setCreativity} label="Criatividade" />
      </div>

      {/* Would play again */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {isPlayerReview ? "Jogaria de novo com este mestre?" : "Aceitaria este jogador de novo?"}
        </label>
        <div className="flex gap-2">
          {[
            { val: true, label: "Sim! 🎯" },
            { val: false, label: "Não" },
          ].map((opt) => (
            <button
              key={String(opt.val)}
              onClick={() => setWouldPlayAgain(opt.val)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                wouldPlayAgain === opt.val
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player reviewing GM — NPC feedback */}
      {isPlayerReview && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-primary" /> Sobre os NPCs
          </h4>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">NPC favorito desta sessão</label>
            <Input value={favoriteNpc} onChange={(e) => setFavoriteNpc(e.target.value)} placeholder="Ex: A taverna Dona Marta..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Impressões sobre os NPCs</label>
            <Textarea
              value={npcImpressions}
              onChange={(e) => setNpcImpressions(e.target.value)}
              placeholder="O que achou dos NPCs? Algum que gostaria de ver mais? Algum que não funcionou?"
              className="min-h-[60px] text-xs"
            />
          </div>
        </div>
      )}

      {/* GM reviewing player */}
      {!isPlayerReview && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Comportamento do Jogador
          </h4>
          <StarRatingInput value={preparedness} onChange={setPreparedness} label="Preparação (ficha, materiais)" />
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Notas sobre o comportamento</label>
            <Textarea
              value={behaviorNotes}
              onChange={(e) => setBehaviorNotes(e.target.value)}
              placeholder="Como o jogador se portou? Interagiu bem com o grupo? Respeitou o ritmo da mesa?"
              className="min-h-[60px] text-xs"
            />
          </div>
        </div>
      )}

      {/* Text fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Destaques positivos</label>
          <Textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="O que mais gostou?"
            className="min-h-[50px] text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Sugestões de melhoria</label>
          <Textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="O que poderia melhorar?"
            className="min-h-[50px] text-xs"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={submitting || overall === 0} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar Feedback
      </Button>
    </Card>
  );
}