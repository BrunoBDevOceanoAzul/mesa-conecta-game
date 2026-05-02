import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useComments } from "@/hooks/use-comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

const roleBadge: Record<string, string> = {
  gm: "Mestre",
  store: "Luderia",
  admin: "HIVIUM",
  brand: "Marca",
  player: "Jogador",
};

export function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { comments, loading, createComment } = useComments({ postId, limit: 100 });
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) { router.push("/login"); return; }
    if (!content.trim()) return;
    setSubmitting(true);
    const result = await createComment(content.trim());
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Erro ao comentar", description: result.error || "Tente novamente.", variant: "destructive" });
    } else {
      setContent("");
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
                  {c.authorName?.charAt(0) || "?"}
                </div>
                <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
                <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {roleBadge["player"] || "Jogador"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
