import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewEligibility {
  eligible: boolean;
  bookingId: string | null;
  gmUserId: string | null;
  tableId: string | null;
  alreadyReviewed: boolean;
}

export function useReviewEligibility(tableId?: string): ReviewEligibility & { loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<ReviewEligibility & { loading: boolean }>({
    eligible: false,
    bookingId: null,
    gmUserId: null,
    tableId: tableId || null,
    alreadyReviewed: false,
    loading: true,
  });

  useEffect(() => {
    if (!user || !tableId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    checkEligibility();
  }, [user, tableId]);

  async function checkEligibility() {
    if (!user || !tableId) return;

    // Find completed booking for this user on this table
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, gm_user_id, game_table_id")
      .eq("player_user_id", user.id)
      .eq("game_table_id", tableId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();

    if (!booking) {
      setState({ eligible: false, bookingId: null, gmUserId: null, tableId, alreadyReviewed: false, loading: false });
      return;
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("reviewer_user_id", user.id)
      .limit(1)
      .maybeSingle();

    setState({
      eligible: !existingReview,
      bookingId: booking.id,
      gmUserId: booking.gm_user_id,
      tableId: booking.game_table_id,
      alreadyReviewed: !!existingReview,
      loading: false,
    });
  }

  return state;
}

export function useGMReviews(userId?: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadReviews();
  }, [userId]);

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_user_id", userId!)
      .eq("review_type", "gm")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    const list = (data as any[]) || [];
    setReviews(list);
    if (list.length > 0) {
      setStats({
        avgRating: list.reduce((s, r) => s + r.rating, 0) / list.length,
        totalReviews: list.length,
      });
    }
    setLoading(false);
  }

  return { reviews, stats, loading, reload: loadReviews };
}
