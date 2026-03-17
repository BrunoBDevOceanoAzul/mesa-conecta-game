import type { MockPost, UserRole } from "@/data/mock";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  gm: { label: "Mestre", className: "bg-primary/15 text-primary" },
  store: { label: "Loja", className: "bg-secondary/15 text-secondary" },
  brand: { label: "Marca", className: "bg-accent/15 text-accent" },
  player: { label: "Jogador", className: "bg-muted text-muted-foreground" },
};

interface PostCardProps {
  post: MockPost;
}

export function PostCard({ post }: PostCardProps) {
  const badge = roleBadge[post.authorRole];
  const date = new Date(post.createdAt);
  const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const timeStr = timeAgo === 0 ? "Hoje" : timeAgo === 1 ? "Ontem" : `${timeAgo}d atrás`;

  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${post.sponsored ? "sponsored-glow" : ""}`}>
      {post.sponsored && (
        <span className="mb-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          Patrocinado
        </span>
      )}

      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {post.authorName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{timeStr}</span>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-foreground/90">{post.content}</p>

      <div className="flex items-center gap-4 text-muted-foreground">
        <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
          <Heart className="h-4 w-4" /> {post.likes}
        </button>
        <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
          <MessageCircle className="h-4 w-4" /> Comentar
        </button>
        <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>
    </div>
  );
}
