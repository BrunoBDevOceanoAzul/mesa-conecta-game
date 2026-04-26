import { useEffect, useState, useCallback } from "react";
import { postsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost } from "@/components/feed/FeedPostCard";

interface UsePostsOptions {
  limit?: number;
  offset?: number;
  role?: string;
  type?: string;
  sponsored?: boolean;
}

function mapApiPostToFeedPost(apiPost: any): FeedPost {
  return {
    id: apiPost.id,
    author_id: apiPost.userId,
    author_role: apiPost.author?.role ?? "player",
    post_type: apiPost.type,
    title: null,
    content: apiPost.content,
    image_url: apiPost.mediaUrls?.[0] ?? null,
    status: "published",
    is_sponsored: false,
    sponsor_label: null,
    related_table_id: apiPost.mesaId ?? null,
    cta_text: null,
    cta_url: null,
    tags: [],
    impressions: 0,
    clicks: 0,
    shares: apiPost.shareCount ?? 0,
    likes_count: apiPost.likeCount ?? 0,
    published_at: apiPost.createdAt,
    slug: apiPost.author?.slug ?? null,
    author_name: apiPost.author?.name ?? "Usuário",
    author_avatar_url: apiPost.author?.avatarUrl ?? undefined,
    author_slug: apiPost.author?.slug ?? undefined,
    author_city: apiPost.author?.city ?? undefined,
    table_title: apiPost.mesa?.title ?? undefined,
    table_system: apiPost.mesa?.system ?? undefined,
    table_seats: undefined,
    table_start_at: apiPost.mesa?.startAt ?? undefined,
    table_slug: apiPost.mesa?.slug ?? undefined,
    user_liked: apiPost.userLiked ?? false,
  };
}

export function usePosts(options: UsePostsOptions = {}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, limit: 20, offset: 0 });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postsApi.list({
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
        role: options.role,
        type: options.type,
        sponsored: options.sponsored,
      });
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setPosts(data.data.map(mapApiPostToFeedPost));
        setMeta(data.meta ?? { total: 0, limit: 20, offset: 0 });
      } else {
        setError(data.error || "Falha ao carregar posts");
        setPosts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.offset, options.role, options.type, options.sponsored]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(
    async (post: {
      content: string;
      type?: "text" | "image" | "video" | "mesa_share" | "review_share" | "event" | "announcement";
      mesaId?: string;
      mediaUrls?: string[];
    }) => {
      if (!user) return { ok: false, error: "Não autenticado" };
      try {
        const response = await postsApi.create(post);
        const data = await response.json();
        if (data.ok) {
          await fetchPosts();
          return { ok: true, data: data.data };
        }
        return { ok: false, error: data.error || "Falha ao criar post" };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
      }
    },
    [user, fetchPosts]
  );

  const deletePost = useCallback(
    async (id: string) => {
      if (!user) return { ok: false, error: "Não autenticado" };
      try {
        const response = await postsApi.delete(id);
        const data = await response.json();
        if (data.ok) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          return { ok: true };
        }
        return { ok: false, error: data.error || "Falha ao deletar post" };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
      }
    },
    [user]
  );

  return {
    posts,
    loading,
    error,
    meta,
    refetch: fetchPosts,
    createPost,
    deletePost,
  };
}
