import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedPost } from "@/components/feed/FeedPostCard";

interface FeedFilters {
  role?: string;
  postType?: string;
  sponsored?: boolean;
}

export function useFeedPosts(filters: FeedFilters = {}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    // Build query
    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("status", "published")
      .order("is_sponsored", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(50);

    if (filters.role) query = query.eq("author_role", filters.role);
    if (filters.postType) query = query.eq("post_type", filters.postType);
    if (filters.sponsored === true) query = query.eq("is_sponsored", true);

    const { data: rawPosts, error } = await query;
    if (error || !rawPosts) {
      setLoading(false);
      return;
    }

    // Get unique author ids
    const authorIds = [...new Set(rawPosts.map((p: any) => p.author_id))];
    const tableIds = rawPosts
      .map((p: any) => p.related_table_id)
      .filter(Boolean);

    // Fetch profiles + tables in parallel
    const [profilesRes, tablesRes, likesRes] = await Promise.all([
      authorIds.length > 0
        ? supabase.from("profiles").select("user_id, name, slug, city, avatar_url, role").in("user_id", authorIds)
        : Promise.resolve({ data: [] }),
      tableIds.length > 0
        ? supabase.from("game_tables").select("id, title, system_name, seats_available, start_at, slug").in("id", tableIds)
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("post_likes").select("post_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const tableMap = new Map((tablesRes.data || []).map((t: any) => [t.id, t]));
    const likedSet = new Set((likesRes.data || []).map((l: any) => l.post_id));

    const enriched: FeedPost[] = rawPosts.map((p: any) => {
      const profile = profileMap.get(p.author_id);
      const table = p.related_table_id ? tableMap.get(p.related_table_id) : null;
      return {
        ...p,
        tags: p.tags || [],
        author_name: profile?.name || "Usuário",
        author_avatar_url: profile?.avatar_url,
        author_slug: profile?.slug,
        author_city: profile?.city,
        table_title: table?.title,
        table_system: table?.system_name,
        table_seats: table?.seats_available,
        table_start_at: table?.start_at,
        table_slug: table?.slug,
        user_liked: likedSet.has(p.id),
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user, filters.role, filters.postType, filters.sponsored]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}
