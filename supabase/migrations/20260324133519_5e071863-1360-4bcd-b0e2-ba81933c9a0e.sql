
-- Character sheets table for standalone character management
CREATE TABLE public.character_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_name text NOT NULL DEFAULT 'epico',
  character_name text NOT NULL DEFAULT '',
  player_name text NOT NULL DEFAULT '',
  portrait_url text,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for user lookup
CREATE INDEX idx_character_sheets_user ON public.character_sheets(user_id, system_name);

-- RLS
ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sheets
CREATE POLICY "Users manage own sheets"
  ON public.character_sheets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all sheets"
  ON public.character_sheets FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.character_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
