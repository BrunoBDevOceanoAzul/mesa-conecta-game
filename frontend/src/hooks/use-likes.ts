import { useState, useCallback } from "react";
import { likesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useLikes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const togglePostLike = useCallback(
    async (postId: string) => {
      if (!user) return { ok: false, error: "Não autenticado", liked: false };
      setLoading((prev) => ({ ...prev, [`post_${postId}`]: true }));
      try {
        const response = await likesApi.togglePostLike(postId);
        const data = await response.json();
        return {
          ok: data.ok ?? false,
          error: data.error,
          liked: data.liked ?? false,
          likeCount: data.likeCount,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Erro de rede",
          liked: false,
        };
      } finally {
        setLoading((prev) => ({ ...prev, [`post_${postId}`]: false }));
      }
    },
    [user]
  );

  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      if (!user) return { ok: false, error: "Não autenticado", liked: false };
      setLoading((prev) => ({ ...prev, [`comment_${commentId}`]: true }));
      try {
        const response = await likesApi.toggleCommentLike(commentId);
        const data = await response.json();
        return {
          ok: data.ok ?? false,
          error: data.error,
          liked: data.liked ?? false,
          likeCount: data.likeCount,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Erro de rede",
          liked: false,
        };
      } finally {
        setLoading((prev) => ({ ...prev, [`comment_${commentId}`]: false }));
      }
    },
    [user]
  );

  const isLoading = useCallback(
    (id: string, type: "post" | "comment") => {
      return loading[`${type}_${id}`] ?? false;
    },
    [loading]
  );

  return {
    togglePostLike,
    toggleCommentLike,
    isLoading,
  };
}
