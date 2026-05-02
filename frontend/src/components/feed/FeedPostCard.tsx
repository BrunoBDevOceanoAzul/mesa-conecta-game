import { Heart, MessageCircle, Share2, Sparkles, ExternalLink, MapPin, Calendar, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { likesApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { SharePostModal } from "@/components/feed/SharePostModal";

const roleBadgeConfig: Record<string, { label: string; className: string }> = {
  gm: { label: "Mestre", className: "bg-plum-100 text-plum-600 border-plum-200" },
  store: { label: "Luderia", className: "bg-coral-100 text-coral-500 border-coral-200" },
  brand: { label: "Marca", className: "bg-gold-50 text-plum-600 border-gold-100" },
  admin: { label: "HIVIUM", className: "bg-plum-100 text-plum-600 border-plum-200" },
  player: { label: "Jogador", className: "bg-teal-100 text-teal-600 border-teal-200" },
};

const postTypeConfig: Record<string, { label: string; className: string }> = {
  table_announcement: { label: "Nova mesa", className: "bg-plum-50 text-plum-500" },
  event: { label: "Evento", className: "bg-coral-50 text-coral-500" },
  institutional: { label: "Comunidade", className: "bg-teal-50 text-teal-500" },
  promotion: { label: "Promoção", className: "bg-gold-50 text-gold-500" },
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
  author_name?: string;
  author_avatar_url?: string;
  author_slug?: string;
  author_city?: string;
  table_title?: string;
  table_system?: string;
  table_seats?: number;
  table_start_at?: string;
  table_slug?: string;
  user_liked?: boolean;
}

interface FeedPostCardProps {
  post: FeedPost;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export function FeedPostCard({ post, onLikeToggle }: FeedPostCardProps) {
  const router = useRouter();
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
      router.push("/login");
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    onLikeToggle?.(post.id, newLiked);

    try {
      const response = await likesApi.togglePostLike(post.id);
      const data = await response.json();
      if (data.ok) {
        setLiked(data.liked ?? newLiked);
        if (typeof data.likeCount === "number") {
          setLikesCount(data.likeCount);
        }
      }
    } catch (err) {
      // Revert on error
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handlePostClick = () => {
    const target = post.slug || post.id;
    router.push(`/post/${target}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.author_role === "gm" && post.author_slug) {
      router.push(`/mestre/${post.author_slug}`);
    } else if (post.author_role === "store" && post.author_slug) {
      router.push(`/loja/${post.author_slug}`);
    }
  };

  const handleTableClick = () => {
    if (post.related_table_id) {
      router.push(`/mesa/${post.related_table_id}`);
    }
  };

  const handleCtaClick = () => {
    if (post.cta_url) {
      if (post.cta_url.startsWith("/")) router.push(post.cta_url);
      else window.open(post.cta_url, "_blank");
    }
  };

  return (
    <div
      onClick={handlePostClick}
      className={`group rounded-xl border transition-all duration-200 cursor-pointer ${
        post.is_sponsored
          ? "border-gold-200 bg-card shadow-glow-gold"
          : "border-border bg-card hover:border-plum-200 hover:shadow-sm"
      }`}
    >
      {/* Sponsored / Type badge strip */}
      {(post.is_sponsored || typeConfig) && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          {post.is_sponsored && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold-500">
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
            className="h-10 w-10 rounded-full bg-plum-50 flex items-center justify-center text-sm font-bold text-plum-500 ring-1 ring-plum-200 hover:ring-plum-300 transition-all shrink-0"
          >
            {post.author_name?.charAt(0) || "?"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleAuthorClick} className="text-sm font-semibold text-foreground truncate hover:text-plum-500 transition-colors">
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
            className="w-full mb-3 rounded-lg border border-border bg-plum-50/50 p-3 text-left hover:border-plum-200 hover:bg-plum-50 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-plum-500">{post.table_system}</span>
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
              <Badge key={tag} variant="secondary" className="text-[10px] bg-plum-50 text-plum-400 border-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-coral-400 font-semibold" : "text-muted-foreground hover:text-coral-400"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-coral-400" : ""}`} /> {likesCount > 0 ? likesCount : ""}
          </button>
          <MessageCircle
            className="h-4 w-4 text-muted-foreground hover:text-plum-400 cursor-pointer transition-colors"
            onClick={handlePostClick}
          />
          <div className="ml-auto">
            <SharePostModal
              postId={post.id}
              postSlug={post.slug || null}
              postTitle={post.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
