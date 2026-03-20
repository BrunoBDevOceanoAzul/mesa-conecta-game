import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  post_type: string;
  created_at: string;
}

interface MesaFeedProps {
  mesaId: string;
  mesaTitle: string;
}

export function MesaFeed({ mesaId, mesaTitle }: MesaFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!mesaId) return;

    const fetchPosts = async () => {
      const { data } = await supabase
        .from("mesa_feed_posts")
        .select("*")
        .eq("mesa_id", mesaId)
        .order("created_at", { ascending: false })
        .limit(50);
      setPosts((data as FeedPost[]) || []);
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel(`mesa-feed-${mesaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mesa_feed_posts", filter: `mesa_id=eq.${mesaId}` }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mesaId]);

  const handlePost = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const authorName = profile?.display_name || profile?.name || user.email?.split("@")[0] || "Jogador";

      const { error } = await supabase.from("mesa_feed_posts").insert({
        mesa_id: mesaId,
        author_id: user.id,
        author_name: authorName,
        content: content.trim(),
        post_type: "message",
      });

      if (error) throw error;

      // Track metric
      await supabase.from("mesa_engagement_metrics").insert({
        mesa_id: mesaId,
        user_id: user.id,
        event_type: "feed_post",
      });

      setContent("");
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Mural da Mesa
      </h2>

      {/* Post input */}
      {user && (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compartilhe algo com o grupo..."
            rows={2}
            className="resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{content.length}/500</span>
            <Button
              variant="hero"
              size="sm"
              className="gap-1.5"
              onClick={handlePost}
              disabled={posting || !content.trim()}
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publicar
            </Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma mensagem ainda. Seja o primeiro a postar! 💬
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {posts.map((post) => (
            <div key={post.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                {initials(post.author_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{post.author_name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
