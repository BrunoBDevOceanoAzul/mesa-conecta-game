import { Heart, MessageCircle, Share2, Sparkles, ExternalLink, MapPin, Calendar, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const roleBadgeConfig: Record<string, { label: string; className: string }> = {
  gm: { label: "Mestre", className: "bg-primary/15 text-primary border-primary/20" },
  store: { label: "Luderia", className: "bg-secondary/15 text-secondary border-secondary/20" },
  brand: { label: "Marca", className: "bg-info/15 text-info border-info/20" },
  admin: { label: "HIVIUM", className: "bg-accent/15 text-accent border-accent/20" },
  player: { label: "Jogador", className: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20" },
};

const postTypeConfig: Record<string, { label: string; className: string }> = {
  table_announcement: { label: "Nova mesa", className: "bg-primary/10 text-primary" },
  event: { label: "Evento", className: "bg-secondary/10 text-secondary" },
  institutional: { label: "Comunidade", className: "bg-accent/10 text-accent" },
  promotion: { label: "Promoção", className: "bg-warning/10 text-warning" },
};

export interface FeedPost {
  id: string;
  author_id: string;
  author_role: string;
  post_type: string;
  title: string | null;
  content: string;
  image_url: string | null;
  status: string;
  is_sponsored: boolean;
  sponsor_label: string | null;
  related_table_id: string | null;
  cta_text: string | null;
  cta_url: string | null;
  tags: string[];
  impressions: number;
  clicks: number;
  shares: number;
  likes_count: number;
  published_at: string;
  slug?: string | null;
  // Joined
  author_name?: string;
  author_avatar_url?: string;
  author_slug?: string;
  author_city?: string;
  // Related table
  table_title?: string;
  table_system?: string;
  table_seats?: number;
  table_start_at?: string;
  table_slug?: string;
  // User interaction
  user_liked?: boolean;
}

interface FeedPostCardProps {
  post: FeedPost;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export function FeedPostCard({ post, onLikeToggle }: FeedPostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [sharing, setSharing] = useState(false);

  const badge = roleBadgeConfig[post.author_role] || roleBadgeConfig.player;
  const typeConfig = postTypeConfig[post.post_type];

  const date = new Date(post.published_at);
  const now = Date.now();
  const diffH = Math.floor((now - date.getTime()) / (1000 * 60 * 60));
  const timeStr = diffH < 1 ? "Agora" : diffH < 24 ? `${diffH}h` : diffH < 48 ? "Ontem" : `${Math.floor(diffH / 24)}d`;

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    onLikeToggle?.(post.id, newLiked);

    if (newLiked) {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const url = `${window.location.origin}/feed?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!", description: "Compartilhe onde quiser." });
      // Track share
      await supabase.from("community_posts").update({ shares: post.shares + 1 }).eq("id", post.id);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
    setSharing(false);
  };

  const handleAuthorClick = () => {
    if (post.author_role === "gm" && post.author_slug) {
      navigate(`/mestre/${post.author_slug}`);
    } else if (post.author_role === "store" && post.author_slug) {
      navigate(`/loja/${post.author_slug}`);
    }
  };

  const handleTableClick = () => {
    if (post.related_table_id) {
      navigate(`/mesa/${post.related_table_id}`);
    }
  };

  const handleCtaClick = () => {
    if (post.cta_url) {
      if (post.cta_url.startsWith("/")) navigate(post.cta_url);
      else window.open(post.cta_url, "_blank");
    }
  };

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        post.is_sponsored
          ? "border-secondary/25 bg-card shadow-lg shadow-secondary/5"
          : "border-border bg-card hover:border-border-strong"
      }`}
    >
      {/* Sponsored / Type badge strip */}
      {(post.is_sponsored || typeConfig) && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          {post.is_sponsored && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
              <Sparkles className="h-3 w-3" /> {post.sponsor_label || "Em destaque"}
            </span>
          )}
          {typeConfig && !post.is_sponsored && (
            <span className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${typeConfig.className}`}>
              {typeConfig.label}
            </span>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Author header */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={handleAuthorClick}
            className="h-10 w-10 rounded-full bg-primary/12 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/15 hover:ring-primary/30 transition-all shrink-0"
          >
            {post.author_name?.charAt(0) || "?"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleAuthorClick} className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                {post.author_name || "Anônimo"}
              </button>
              <span className={`inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5 border ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{timeStr}</span>
              {post.author_city && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{post.author_city}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h3 className="text-base font-display font-semibold text-foreground mb-2">{post.title}</h3>
        )}

        {/* Content */}
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line mb-3">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Related table card */}
        {post.related_table_id && post.table_title && (
          <button
            onClick={handleTableClick}
            className="w-full mb-3 rounded-lg border border-border bg-surface/50 p-3 text-left hover:border-primary/30 hover:bg-surface-hover transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary">{post.table_system}</span>
              {post.table_seats != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {post.table_seats} vagas
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-foreground block">{post.table_title}</span>
            {post.table_start_at && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.table_start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </button>
        )}

        {/* CTA button */}
        {post.cta_text && post.cta_url && (
          <Button variant="outline" size="sm" className="mb-3 gap-1.5" onClick={handleCtaClick}>
            <ExternalLink className="h-3.5 w-3.5" /> {post.cta_text}
          </Button>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} /> {likesCount > 0 ? likesCount : ""}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
