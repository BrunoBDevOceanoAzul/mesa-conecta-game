
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Board games catalog
CREATE TABLE public.board_games_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL DEFAULT 'comparajogos',
  source_record_id bigint UNIQUE NOT NULL,
  source_product_id bigint,
  slug text,
  name text NOT NULL,
  normalized_name text,
  type text NOT NULL DEFAULT 'unknown' CHECK (type IN ('game', 'expansion', 'accessory', 'rpg', 'unknown')),
  playing_time integer,
  min_playtime integer,
  max_playtime integer,
  min_players integer,
  max_players integer,
  thumbnail_url text,
  bgg_rating numeric,
  bgg_ranking integer,
  weight_complexity numeric,
  own_count integer,
  wish_count integer,
  min_price_new numeric,
  min_price_used numeric,
  new_count integer,
  used_count integer,
  is_available boolean DEFAULT false,
  current_game_value numeric,
  average_rental_value numeric,
  raw_json jsonb,
  search_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.board_game_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_game_id uuid REFERENCES public.board_games_catalog(id) ON DELETE CASCADE NOT NULL,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  alias_type text NOT NULL DEFAULT 'normalized' CHECK (alias_type IN ('official', 'normalized', 'manual', 'imported')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.catalog_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL DEFAULT 'comparajogos',
  file_name text,
  total_records integer DEFAULT 0,
  imported_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  logs_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bgc_normalized_name ON public.board_games_catalog (normalized_name);
CREATE INDEX idx_bgc_name_trgm ON public.board_games_catalog USING gin (name gin_trgm_ops);
CREATE INDEX idx_bgc_normalized_name_trgm ON public.board_games_catalog USING gin (normalized_name gin_trgm_ops);
CREATE INDEX idx_bgc_type ON public.board_games_catalog (type);
CREATE INDEX idx_bgc_available ON public.board_games_catalog (is_available);
CREATE INDEX idx_bgc_players ON public.board_games_catalog (min_players, max_players);
CREATE INDEX idx_bgc_search_text_trgm ON public.board_games_catalog USING gin (search_text gin_trgm_ops);
CREATE INDEX idx_bgc_source ON public.board_games_catalog (source_name, source_record_id);
CREATE INDEX idx_bga_board_game ON public.board_game_aliases (board_game_id);
CREATE INDEX idx_bga_alias_trgm ON public.board_game_aliases USING gin (normalized_alias gin_trgm_ops);

-- RLS
ALTER TABLE public.board_games_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_game_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catalog" ON public.board_games_catalog FOR SELECT USING (true);
CREATE POLICY "Anyone can read aliases" ON public.board_game_aliases FOR SELECT USING (true);
CREATE POLICY "Admins manage catalog" ON public.board_games_catalog FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage aliases" ON public.board_game_aliases FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage import runs" ON public.catalog_import_runs FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_bgc_updated_at BEFORE UPDATE ON public.board_games_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
