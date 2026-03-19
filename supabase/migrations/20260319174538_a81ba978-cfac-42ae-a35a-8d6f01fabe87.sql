
-- Add aggregation columns to store_profiles
ALTER TABLE public.store_profiles
  ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;
