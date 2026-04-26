import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewEligibility {
  eligible: boolean;
  bookingId: string | null;
  gmUserId: string | null;
  tableId: string | null;
  storeUserId: string | null;
  alreadyReviewed: boolean;
}

interface BookingReviewTargets {
  bookingId: string;
  tableId: string;
  gmUserId: string;
  storeUserId: string | null;
  tableTitle: string;
  gmReviewed: boolean;
  tableReviewed: boolean;
  storeReviewed: boolean;
}

export function useReviewEligibility(tableId?: string): ReviewEligibility & { loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<ReviewEligibility & { loading: boolean }>({
    eligible: false,
    bookingId: null,
    gmUserId: null,
    tableId: tableId || null,
    storeUserId: null,
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

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, gm_user_id, game_table_id, store_user_id")
      .eq("player_user_id", user.id)
      .eq("game_table_id", tableId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();

    if (!booking) {
      setState({ eligible: false, bookingId: null, gmUserId: null, tableId, storeUserId: null, alreadyReviewed: false, loading: false });
      return;
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("reviewer_user_id", user.id)
      .eq("review_type", "table")
      .limit(1)
      .maybeSingle();

    setState({
      eligible: !existingReview,
      bookingId: booking.id,
      gmUserId: booking.gm_user_id,
      tableId: booking.game_table_id,
      storeUserId: booking.store_user_id || null,
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

export function useStoreReviews(storeUserId?: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeUserId) { setLoading(false); return; }
    loadReviews();
  }, [storeUserId]);

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_store_id", storeUserId!)
      .eq("review_type", "store")
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

/** Returns completed bookings that haven't been fully reviewed yet */
export function usePendingReviews() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<BookingReviewTargets[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadPending();
  }, [user]);

  async function loadPending() {
    if (!user) return;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, game_table_id, gm_user_id, store_user_id")
      .eq("player_user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (!bookings || bookings.length === 0) {
      setTargets([]);
      setLoading(false);
      return;
    }

    const bookingIds = bookings.map((b) => b.id);
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("booking_id, review_type")
      .eq("reviewer_user_id", user.id)
      .in("booking_id", bookingIds);

    const reviewSet = new Set((existingReviews || []).map((r: any) => `${r.booking_id}:${r.review_type}`));

    // Get table titles
    const tableIds = [...new Set(bookings.map((b) => b.game_table_id))];
    const { data: tables } = await supabase
      .from("game_tables")
      .select("id, title")
      .in("id", tableIds);
    const tableMap = new Map((tables || []).map((t: any) => [t.id, t.title]));

    const result: BookingReviewTargets[] = bookings
      .map((b) => ({
        bookingId: b.id,
        tableId: b.game_table_id,
        gmUserId: b.gm_user_id,
        storeUserId: b.store_user_id || null,
        tableTitle: tableMap.get(b.game_table_id) || "Mesa",
        gmReviewed: reviewSet.has(`${b.id}:gm`),
        tableReviewed: reviewSet.has(`${b.id}:table`),
        storeReviewed: reviewSet.has(`${b.id}:store`),
      }))
      .filter((t) => !t.gmReviewed || !t.tableReviewed || (t.storeUserId && !t.storeReviewed));

    setTargets(result);
    setLoading(false);
  }

  return { targets, loading, reload: loadPending };
}
