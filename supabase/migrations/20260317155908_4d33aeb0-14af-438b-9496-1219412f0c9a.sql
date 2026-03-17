
-- Add new profile fields for enhanced onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability_days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_times text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS themes_liked text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS themes_avoided text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoided_notes text,
  ADD COLUMN IF NOT EXISTS session_format_pref text,
  ADD COLUMN IF NOT EXISTS narrative_styles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_mastering text,
  ADD COLUMN IF NOT EXISTS max_players integer,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS mesa_formats text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS special_services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS brand_category text,
  ADD COLUMN IF NOT EXISTS brand_objective text,
  ADD COLUMN IF NOT EXISTS brand_audience text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_budget text;

-- Add new store fields for enhanced onboarding
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS ticket_avg text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS game_catalog text[] DEFAULT '{}';
