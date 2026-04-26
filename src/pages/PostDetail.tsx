import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi, likesApi } from "@/lib/api";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PostComments } from "@/components/feed/PostComments";
import { SharePostModal } from "@/components/feed/SharePostModal";
import { FeedPostCard, type FeedPost } from "@/components/feed/FeedPostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Sparkles, Users, ExternalLink, Heart, Share2, Loader2, ChevronRight } from "lucide-react";

const roleBadgeConfig: Record<string, { label: string; className: string }> = {
  gm: { label: "Mestre", className: "bg-primary/15 text-primary border-primary/20" },
  store: { label: "Luderia", className: "bg-secondary/15 text-secondary border-secondary/20" },
  brand: { label: "Marca", className: "bg-info/15 text-info border-info/20" },
  admin: { label: "HIVIUM", className: "bg-accent/15 text-accent border-accent/20" },
  player: { label: "Jogador", className: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20" },
};

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<FeedPost[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);

    // Try API first if slug looks like UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");

    if (isUuid) {
      try {
        const response = await postsApi.getById(slug!);
        const result = await response.json();
        if (result.ok && result.data) {
          const p = result.data;
          const enriched: FeedPost = {
            id: p.id,
            author_id: p.userId,
            author_role: p.author?.role ?? "player",
            post_type: p.type,
            title: null,
            content: p.content,
            image_url: p.mediaUrls?.[0] ?? null,
            status: "published",
            is_sponsored: false,
            sponsor_label: null,
            related_table_id: p.mesaId ?? null,
            cta_text: null,
            cta_url: null,
            tags: [],
            impressions: 0,
            clicks: 0,
            shares: p.shareCount ?? 0,
            likes_count: p.likeCount ?? 0,
            published_at: p.createdAt,
            slug: p.author?.slug ?? null,
            author_name: p.author?.name ?? "Usuário",
            author_avatar_url: p.author?.avatarUrl ?? undefined,
            author_slug: p.author?.slug ?? undefined,
            author_city: p.author?.city ?? undefined,
            table_title: p.mesa?.title ?? undefined,
            table_system: p.mesa?.system ?? undefined,
            table_seats: undefined,
            table_start_at: p.mesa?.startAt ?? undefined,
            table_slug: p.mesa?.slug ?? undefined,
            user_liked: p.userLiked ?? false,
          };
          setPost(enriched);
          setLiked(p.userLiked ?? false);
          setLikesCount(p.likeCount ?? 0);
          setLoading(false);
          // SEO and related posts still via Supabase for now
          fetchRelated(p.userId, p.id, []);
          return;
        }
      } catch (err) {
        // Fall through to Supabase fallback
      }
    }

    // Fallback to Supabase for slug-based lookup
    let query = supabase.from("community_posts").select("*").eq("status", "published");
    if (isUuid) {
      query = query.eq("id", slug!);
    } else {
      query = query.eq("slug", slug!);
    }
    const { data, error } = await query.maybeSingle();

    if (!data || error) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Enrich with author profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, name, slug, city, avatar_url, role")
      .eq("user_id", data.author_id)
      .maybeSingle();

    // Enrich with related table
    let table = null;
    if (data.related_table_id) {
      const { data: t } = await supabase
        .from("game_tables")
        .select("id, title, system_name, seats_available, start_at, slug")
        .eq("id", data.related_table_id)
        .maybeSingle();
      table = t;
    }

    // Check user like
    let userLiked = false;
    if (user) {
      const { data: like } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", data.id)
        .eq("user_id", user.id)
        .maybeSingle();
      userLiked = !!like;
    }

    const enriched: FeedPost = {
      ...data,
      tags: data.tags || [],
      author_name: profile?.name || "Usuário",
      author_avatar_url: profile?.avatar_url,
      author_slug: profile?.slug,
      author_city: profile?.city,
      table_title: table?.title,
      table_system: table?.system_name,
      table_seats: table?.seats_available,
      table_start_at: table?.start_at,
      table_slug: table?.slug,
      user_liked: userLiked,
    };

    setPost(enriched);
    setLiked(userLiked);
    setLikesCount(data.likes_count || 0);

    // Track impression
    await supabase.from("community_posts").update({ impressions: (data.impressions || 0) + 1 }).eq("id", data.id);

    // Set SEO meta
    const seoTitle = `${data.title || "Post"} | HIVIUM`;
    const desc = data.content?.substring(0, 155) + "...";
    document.title = seoTitle;
    setMeta("description", desc);
    setMeta("og:title", seoTitle);
    setMeta("og:description", desc);
    setMeta("og:url", window.location.href);
    setMeta("og:type", "article");
    if (data.image_url) setMeta("og:image", data.image_url);
    setMeta("twitter:card", data.image_url ? "summary_large_image" : "summary");
    setMeta("twitter:title", seoTitle);
    setMeta("twitter:description", desc);

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://mesa-conecta-game.lovable.app/post/${data.slug || data.id}`);

    // JSON-LD structured data
    let ldScript = document.getElementById("post-jsonld") as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement("script");
      ldScript.id = "post-jsonld";
      ldScript.type = "application/ld+json";
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title || "Post",
      description: desc,
      image: data.image_url || undefined,
      datePublished: data.published_at,
      dateModified: data.updated_at,
      author: {
        "@type": "Person",
        name: profile?.name || "Usuário HIVIUM",
        url: profile?.slug ? `https://mesa-conecta-game.lovable.app/mestre/${profile.slug}` : undefined,
      },
      publisher: {
        "@type": "Organization",
        name: "HIVIUM",
        url: "https://mesa-conecta-game.lovable.app",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://mesa-conecta-game.lovable.app/post/${data.slug || data.id}`,
      },
      interactionStatistic: [
        { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: data.likes_count || 0 },
        { "@type": "InteractionCounter", interactionType: "https://schema.org/ShareAction", userInteractionCount: data.shares || 0 },
      ],
    });

    // Fetch related posts
    fetchRelated(data.author_id, data.id, data.tags || []);

    setLoading(false);
  };

  const fetchRelated = async (authorId: string, postId: string, tags: string[]) => {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("status", "published")
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .limit(4);

    if (!data || data.length === 0) return;

    const authorIds = [...new Set(data.map((p: any) => p.author_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name, slug, city, role").in("user_id", authorIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setRelatedPosts(
      data.map((p: any) => {
        const prof = profileMap.get(p.author_id);
        return { ...p, tags: p.tags || [], author_name: prof?.name, author_slug: prof?.slug, author_city: prof?.city };
      })
    );
  };

  const setMeta = (name: string, content: string) => {
    const attr = name.startsWith("og:") ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    if (!post) return;

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));

    try {
      const result = await likesApi.togglePostLike(post.id);
      const data = await result.json();
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

  const handleAuthorClick = () => {
    if (!post) return;
    if (post.author_role === "gm" && post.author_slug) navigate(`/mestre/${post.author_slug}`);
    else if (post.author_role === "store" && post.author_slug) navigate(`/loja/${post.author_slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Post não encontrado</h1>
          <p className="text-muted-foreground mb-6">Este post pode ter sido removido ou ainda não está publicado.</p>
          <Button variant="outline" onClick={() => navigate("/feed")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao feed
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const badge = roleBadgeConfig[post.author_role] || roleBadgeConfig.player;
  const pubDate = new Date(post.published_at);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/feed" className="hover:text-foreground transition-colors">Feed</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{post.title || "Post"}</span>
        </nav>

        {/* Main card */}
        <div className={`rounded-xl border p-6 md:p-8 ${post.is_sponsored ? "border-secondary/25 bg-card shadow-lg shadow-secondary/5" : "border-border bg-card"}`}>
          {/* Sponsored badge */}
          {post.is_sponsored && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <Sparkles className="h-3 w-3" /> {post.sponsor_label || "Em destaque"}
              </span>
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={handleAuthorClick}
              className="h-12 w-12 rounded-full bg-primary/12 flex items-center justify-center text-base font-bold text-primary ring-1 ring-primary/15 hover:ring-primary/30 transition-all shrink-0"
            >
              {post.author_name?.charAt(0) || "?"}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button onClick={handleAuthorClick} className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                  {post.author_name}
                </button>
                <span className={`inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5 border ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{pubDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
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
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">{post.title}</h1>
          )}

          {/* Content */}
          <div className="text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-line mb-5">
            {post.content}
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-5 rounded-lg overflow-hidden">
              <img src={post.image_url} alt={post.title || ""} className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Related table */}
          {post.related_table_id && post.table_title && (
            <button
              onClick={() => navigate(`/mesa/${post.related_table_id}`)}
              className="w-full mb-5 rounded-lg border border-border bg-surface/50 p-4 text-left hover:border-primary/30 hover:bg-surface-hover transition-all"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Mesa relacionada</p>
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

          {/* CTA */}
          {post.cta_text && post.cta_url && (
            <Button variant="default" className="mb-5 gap-2" onClick={() => post.cta_url?.startsWith("/") ? navigate(post.cta_url!) : window.open(post.cta_url!, "_blank")}>
              <ExternalLink className="h-4 w-4" /> {post.cta_text}
            </Button>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-0">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} /> {likesCount > 0 ? likesCount : "Curtir"}
            </button>

            <SharePostModal
              postId={post.id}
              postSlug={post.slug || null}
              postTitle={post.title}
              trigger={
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              }
            />
          </div>
        </div>

        {/* Comments */}
        <PostComments postId={post.id} />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Mais do ecossistema</h3>
            <div className="space-y-4">
              {relatedPosts.slice(0, 3).map((rp) => (
                <Link key={rp.id} to={`/post/${rp.slug || rp.id}`} className="block">
                  <FeedPostCard post={rp} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center">
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">Faça parte do ecossistema HIVIUM</h3>
          <p className="text-sm text-muted-foreground mb-5">Descubra mesas, mestres e luderias perto de você.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/explorar")} className="gap-2">
              <Sparkles className="h-4 w-4" /> Explorar mesas
            </Button>
            {!user && (
              <Button onClick={() => navigate("/cadastro")}>Criar conta</Button>
            )}
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
}
