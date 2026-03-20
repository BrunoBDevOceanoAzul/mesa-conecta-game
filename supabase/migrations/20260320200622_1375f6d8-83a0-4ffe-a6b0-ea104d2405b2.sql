
-- Add slug, instagram, logo_url to stores if not present
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create store_events table for tracking page views, clicks, bookings etc
CREATE TABLE IF NOT EXISTS public.store_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'click_phone', 'click_website', 'click_mesa', 'booking', 'share'
  visitor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (even anon for page views)
CREATE POLICY "Anyone can insert store events"
  ON public.store_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Store owners can view their own events
CREATE POLICY "Store owners can view their events"
  ON public.store_events FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_store_events_store_id ON public.store_events(store_id);
CREATE INDEX IF NOT EXISTS idx_store_events_created_at ON public.store_events(created_at);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
