import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  author_user_id: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}

const roleBadge: Record<string, string> = {
  gm: "Mestre",
  store: "Luderia",
  admin: "HIVIUM",
  brand: "Marca",
  player: "Jogador",
};

export function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data: rawComments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(100);

    if (!rawComments || rawComments.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(rawComments.map((c: any) => c.author_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, role")
      .in("user_id", authorIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setComments(
      rawComments.map((c: any) => {
        const p = profileMap.get(c.author_user_id);
        return { ...c, author_name: p?.name || "Usuário", author_role: p?.role || "player" };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    if (!content.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_user_id: user.id,
      content: content.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao comentar", description: error.message, variant: "destructive" });
    } else {
      setContent("");
      fetchComments();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "Agora";
    if (diff < 60) return `${diff}min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Comentários {comments.length > 0 && <span className="text-sm text-muted-foreground font-normal">({comments.length})</span>}
      </h3>

      {/* Comment input */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? "Deixe seu comentário..." : "Faça login para comentar"}
          className="min-h-[80px] border-0 bg-transparent px-0 focus-visible:ring-0 resize-none"
          disabled={!user}
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !user}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Comentar
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {c.author_name?.charAt(0) || "?"}
                </div>
                <span className="text-sm font-semibold text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {roleBadge[c.author_role || "player"] || "Jogador"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
