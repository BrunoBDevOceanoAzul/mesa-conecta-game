-- Add mesa_type to distinguish professional vs community mesas
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS mesa_type text NOT NULL DEFAULT 'professional';
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS organizer_name text;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS board_game_id uuid REFERENCES public.board_games_catalog(id);
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS address text;

-- Index for community mesas queries
CREATE INDEX IF NOT EXISTS idx_mesas_mesa_type ON public.mesas(mesa_type);
CREATE INDEX IF NOT EXISTS idx_mesas_community_active ON public.mesas(mesa_type, status, start_at) WHERE mesa_type = 'community';

-- RLS: allow any authenticated user to insert community mesas
CREATE POLICY "Users can create community mesas"
ON public.mesas FOR INSERT TO authenticated
WITH CHECK (
  mesa_type = 'community' AND gm_id = auth.uid()
);

-- Track community mesa metrics
CREATE TABLE IF NOT EXISTS public.mesa_engagement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mesa_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own metrics"
ON public.mesa_engagement_metrics FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read metrics"
ON public.mesa_engagement_metrics FOR SELECT TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_mesa_engagement_mesa ON public.mesa_engagement_metrics(mesa_id);
CREATE INDEX IF NOT EXISTS idx_mesa_engagement_type ON public.mesa_engagement_metrics(event_type, created_at);