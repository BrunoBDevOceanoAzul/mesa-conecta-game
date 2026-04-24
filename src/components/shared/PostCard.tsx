import type { Post, UserRole } from "@/data/constants";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  gm: { label: "Mestre", className: "role-badge-gm" },
  store: { label: "Luderia", className: "role-badge-store" },
  brand: { label: "Marca", className: "role-badge-brand" },
  player: { label: "Jogador", className: "role-badge-player" },
};

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const badge = roleBadge[post.authorRole];
  const date = new Date(post.createdAt);
  const timeAgo = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeStr =
    timeAgo === 0 ? "Hoje" : timeAgo === 1 ? "Ontem" : `${timeAgo}d atrás`;

  return (
    <div
      className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
        post.sponsored
          ? "border-secondary/30 sponsored-glow"
          : "border-border hover:border-border-strong"
      }`}
    >
      {post.sponsored && (
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-secondary" />
          <span className="text-overline text-secondary">Destaque</span>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/12 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/15">
          {post.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {post.authorName}
            </span>
            <span className={badge.className}>{badge.label}</span>
          </div>
          <span className="text-caption">{timeStr}</span>
        </div>
      </div>

      <p className="mb-4 text-body-sm text-foreground/85 leading-relaxed">
        {post.content}
      </p>

      <div className="flex items-center gap-5 pt-3 border-t border-border">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Heart className="h-4 w-4" /> {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="h-4 w-4" /> Comentar
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
