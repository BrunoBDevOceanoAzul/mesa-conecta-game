
CREATE TABLE public.mesa_selected_expansions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  expansion_id UUID NOT NULL REFERENCES public.board_games_catalog(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mesa_id, expansion_id)
);

ALTER TABLE public.mesa_selected_expansions ENABLE ROW LEVEL SECURITY;

-- Anyone can view selected expansions for a mesa
CREATE POLICY "Anyone can view mesa expansions"
  ON public.mesa_selected_expansions FOR SELECT
  USING (true);

-- Only the mesa creator can insert expansions
CREATE POLICY "Mesa creator can add expansions"
  ON public.mesa_selected_expansions FOR INSERT
  WITH CHECK (
    added_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.mesas WHERE id = mesa_id AND gm_id = auth.uid()
    )
  );

-- Only the mesa creator can delete expansions
CREATE POLICY "Mesa creator can remove expansions"
  ON public.mesa_selected_expansions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.mesas WHERE id = mesa_id AND gm_id = auth.uid()
    )
  );
