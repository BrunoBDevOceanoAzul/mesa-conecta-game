
-- Add missing columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewed_table_id uuid REFERENCES public.game_tables(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewed_store_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sub_ratings_json jsonb DEFAULT '{}'::jsonb;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_booking_reviewer_type_key') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_reviewer_type_key UNIQUE(booking_id, reviewer_user_id, review_type);
  END IF;
EXCEPTION WHEN others THEN NULL;
END$$;

-- Ensure RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they exist
DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.reviews;
CREATE POLICY "Anyone can read published reviews"
  ON public.reviews FOR SELECT TO public
  USING (status = 'published');

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Admins manage all reviews" ON public.reviews;
CREATE POLICY "Admins manage all reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add aggregation columns to game_tables
ALTER TABLE public.game_tables ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0;
ALTER TABLE public.game_tables ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;
