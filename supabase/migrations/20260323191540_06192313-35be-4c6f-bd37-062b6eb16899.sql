
-- Session assets (images, audio)
CREATE TABLE public.session_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  asset_type text NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'audio')),
  category text NOT NULL DEFAULT 'scene',
  title text NOT NULL,
  description text,
  file_url text,
  generated_prompt text,
  source_type text NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'ai_generated')),
  visibility_status text NOT NULL DEFAULT 'private' CHECK (visibility_status IN ('private', 'staged', 'revealed', 'archived')),
  sort_order int NOT NULL DEFAULT 0,
  -- audio-specific fields
  duration_seconds int,
  default_volume numeric(3,2) DEFAULT 0.8,
  loop_enabled boolean DEFAULT false,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;

-- GM can manage their own mesa assets
CREATE POLICY "GM can manage session assets"
  ON public.session_assets FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mesas WHERE id = game_table_id AND gm_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.mesas WHERE id = game_table_id AND gm_id = auth.uid())
  );

-- Players can see revealed assets
CREATE POLICY "Players can view revealed assets"
  ON public.session_assets FOR SELECT TO authenticated
  USING (visibility_status = 'revealed');

-- Session cues
CREATE TABLE public.session_cues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  image_asset_id uuid REFERENCES public.session_assets(id) ON DELETE SET NULL,
  audio_asset_id uuid REFERENCES public.session_assets(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GM can manage session cues"
  ON public.session_cues FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mesas WHERE id = game_table_id AND gm_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.mesas WHERE id = game_table_id AND gm_id = auth.uid())
  );

CREATE POLICY "Players can view active cues"
  ON public.session_cues FOR SELECT TO authenticated
  USING (is_active = true);

-- Dice rolls
CREATE TABLE public.dice_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  user_name text,
  roll_formula text NOT NULL,
  result_json jsonb NOT NULL DEFAULT '[]',
  total_result int NOT NULL,
  modifier int DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own dice rolls"
  ON public.dice_rolls FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can see public rolls in their mesa"
  ON public.dice_rolls FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mesas WHERE id = game_table_id AND gm_id = auth.uid())
  );

-- Enable realtime for revealed assets and public dice rolls
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dice_rolls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_cues;

-- Storage bucket for session assets
INSERT INTO storage.buckets (id, name, public) VALUES ('session-assets', 'session-assets', true);

-- Storage policies
CREATE POLICY "GM can upload session assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'session-assets');

CREATE POLICY "Anyone can view session assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'session-assets');

CREATE POLICY "GM can delete session assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'session-assets');
