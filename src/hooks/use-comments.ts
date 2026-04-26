import { useEffect, useState, useCallback } from "react";
import { commentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likeCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorAvatarUrl?: string;
}

interface UseCommentsOptions {
  postId: string;
  limit?: number;
  offset?: number;
}

function mapApiComment(apiComment: any): Comment {
  return {
    id: apiComment.id,
    postId: apiComment.postId,
    userId: apiComment.userId,
    content: apiComment.content,
    likeCount: apiComment.likeCount ?? 0,
    isDeleted: apiComment.isDeleted ?? false,
    createdAt: apiComment.createdAt,
    updatedAt: apiComment.updatedAt,
    authorName: apiComment.author?.name ?? "Usuário",
    authorAvatarUrl: apiComment.author?.avatarUrl ?? undefined,
  };
}

export function useComments(options: UseCommentsOptions) {
  const { user } = useAuth();
  const { postId } = options;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await commentsApi.listByPost(postId, {
        limit: options.limit ?? 50,
        offset: options.offset ?? 0,
      });
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setComments(data.data.map(mapApiComment));
      } else {
        setError(data.error || "Falha ao carregar comentários");
        setComments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId, options.limit, options.offset]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = useCallback(
    async (content: string) => {
      if (!user || !postId) return { ok: false, error: "Não autenticado" };
      try {
        const response = await commentsApi.create(postId, content);
        const data = await response.json();
        if (data.ok) {
          await fetchComments();
          return { ok: true, data: data.data };
        }
        return { ok: false, error: data.error || "Falha ao criar comentário" };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
      }
    },
    [user, postId, fetchComments]
  );

  const deleteComment = useCallback(
    async (id: string) => {
      if (!user) return { ok: false, error: "Não autenticado" };
      try {
        const response = await commentsApi.delete(id);
        const data = await response.json();
        if (data.ok) {
          setComments((prev) => prev.filter((c) => c.id !== id));
          return { ok: true };
        }
        return { ok: false, error: data.error || "Falha ao deletar comentário" };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
      }
    },
    [user]
  );

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    createComment,
    deleteComment,
  };
}
