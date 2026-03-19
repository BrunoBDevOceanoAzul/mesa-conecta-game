
CREATE OR REPLACE FUNCTION public.search_board_games(
  search_query text,
  game_type_filter text DEFAULT NULL,
  result_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  type text,
  thumbnail_url text,
  min_players integer,
  max_players integer,
  min_playtime integer,
  max_playtime integer,
  playing_time integer,
  bgg_rating numeric,
  weight_complexity numeric,
  is_available boolean,
  similarity_score real
)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT
    bg.id,
    bg.name,
    bg.slug,
    bg.type,
    bg.thumbnail_url,
    bg.min_players,
    bg.max_players,
    bg.min_playtime,
    bg.max_playtime,
    bg.playing_time,
    bg.bgg_rating,
    bg.weight_complexity,
    bg.is_available,
    GREATEST(
      similarity(bg.normalized_name, lower(search_query)),
      similarity(bg.name, search_query)
    ) AS similarity_score
  FROM public.board_games_catalog bg
  WHERE
    (game_type_filter IS NULL OR bg.type = game_type_filter)
    AND (
      bg.normalized_name ILIKE '%' || lower(search_query) || '%'
      OR bg.name ILIKE '%' || search_query || '%'
      OR similarity(bg.normalized_name, lower(search_query)) > 0.15
    )
  ORDER BY
    CASE WHEN bg.normalized_name = lower(search_query) THEN 0 ELSE 1 END,
    GREATEST(
      similarity(bg.normalized_name, lower(search_query)),
      similarity(bg.name, search_query)
    ) DESC,
    bg.bgg_rating DESC NULLS LAST
  LIMIT result_limit;
$$;
