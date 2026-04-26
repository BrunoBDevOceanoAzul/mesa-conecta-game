import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreMetrics {
  pageViews: number;
  phoneClicks: number;
  websiteClicks: number;
  mesaClicks: number;
  shares: number;
  bookings: number;
  viewsByDay: { date: string; count: number }[];
}

export function useStoreAnalytics(storeId: string | undefined, days = 30) {
  const [metrics, setMetrics] = useState<StoreMetrics>({
    pageViews: 0,
    phoneClicks: 0,
    websiteClicks: 0,
    mesaClicks: 0,
    shares: 0,
    bookings: 0,
    viewsByDay: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: events } = await supabase
      .from("store_events")
      .select("event_type, created_at")
      .eq("store_id", storeId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (!events) {
      setLoading(false);
      return;
    }

    const counts: Record<string, number> = {};
    const dayMap: Record<string, number> = {};

    for (const ev of events) {
      counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
      if (ev.event_type === "page_view") {
        const day = ev.created_at.slice(0, 10);
        dayMap[day] = (dayMap[day] || 0) + 1;
      }
    }

    setMetrics({
      pageViews: counts["page_view"] || 0,
      phoneClicks: counts["click_phone"] || 0,
      websiteClicks: counts["click_website"] || 0,
      mesaClicks: counts["click_mesa"] || 0,
      shares: counts["share"] || 0,
      bookings: counts["booking"] || 0,
      viewsByDay: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
    });
    setLoading(false);
  }, [storeId, days]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
}
