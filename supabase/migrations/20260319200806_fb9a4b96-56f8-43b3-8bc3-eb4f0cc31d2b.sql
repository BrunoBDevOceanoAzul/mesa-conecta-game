
-- RPG System Templates: stores default character sheet structures per system
CREATE TABLE public.rpg_system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  default_character_form_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_materials_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Templates: reusable form schemas (system defaults or user-created)
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL DEFAULT 'character_sheet',
  system_template_id UUID REFERENCES public.rpg_system_templates(id) ON DELETE SET NULL,
  created_by_user_id UUID,
  name TEXT NOT NULL,
  schema_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Preparation Flows: per-table config linking form + materials
CREATE TABLE public.table_preparation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  system_template_id UUID REFERENCES public.rpg_system_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Preparação da Mesa',
  description TEXT,
  form_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  materials_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  share_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_table_id)
);

-- Player Form Submissions: tracks each player's character sheet
CREATE TABLE public.player_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  form_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player Material Access: tracks when players viewed materials
CREATE TABLE public.player_material_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  materials_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Performance Metrics: aggregated analytics per form
CREATE TABLE public.form_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  form_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  total_started INT NOT NULL DEFAULT 0,
  total_submitted INT NOT NULL DEFAULT 0,
  average_completion_time_seconds INT,
  abandonment_rate NUMERIC(5,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_table_id)
);

-- Enable RLS on all tables
ALTER TABLE public.rpg_system_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_preparation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_material_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_performance_metrics ENABLE ROW LEVEL SECURITY;

-- rpg_system_templates: public read
CREATE POLICY "Anyone can read system templates"
  ON public.rpg_system_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Anon can read system templates"
  ON public.rpg_system_templates FOR SELECT
  TO anon USING (true);

-- form_templates: public defaults readable, own templates manageable
CREATE POLICY "Anyone can read default/public templates"
  ON public.form_templates FOR SELECT
  TO authenticated USING (is_default = true OR is_public = true OR created_by_user_id = auth.uid());

CREATE POLICY "Users can create own templates"
  ON public.form_templates FOR INSERT
  TO authenticated WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.form_templates FOR UPDATE
  TO authenticated USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.form_templates FOR DELETE
  TO authenticated USING (created_by_user_id = auth.uid());

-- table_preparation_flows: table owner (GM) can manage, players with booking can read
CREATE POLICY "GM can manage preparation flows"
  ON public.table_preparation_flows FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
  );

CREATE POLICY "Players with booking can read preparation flows"
  ON public.table_preparation_flows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.game_table_id = table_preparation_flows.game_table_id
      AND b.player_user_id = auth.uid()
      AND b.status IN ('confirmed', 'pending')
    )
  );

-- player_form_submissions: own submissions
CREATE POLICY "Players can manage own submissions"
  ON public.player_form_submissions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "GM can read submissions for their tables"
  ON public.player_form_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
  );

-- player_material_access: own access
CREATE POLICY "Players can manage own material access"
  ON public.player_material_access FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "GM can read material access for their tables"
  ON public.player_material_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
  );

-- form_performance_metrics: GM can read for their tables
CREATE POLICY "GM can read metrics for their tables"
  ON public.form_performance_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_rpg_system_templates BEFORE UPDATE ON public.rpg_system_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_form_templates BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_table_preparation_flows BEFORE UPDATE ON public.table_preparation_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_player_form_submissions BEFORE UPDATE ON public.player_form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_player_material_access BEFORE UPDATE ON public.player_material_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
