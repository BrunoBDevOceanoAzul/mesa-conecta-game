import { supabase } from "@/integrations/supabase/client";

export async function trackStoreEvent(
  storeId: string,
  eventType: string,
  metadata?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("store_events").insert({
      store_id: storeId,
      event_type: eventType,
      visitor_user_id: user?.id || null,
      metadata_json: metadata || null,
    } as any);
  } catch {
    // silent - tracking should never block UX
  }
}
