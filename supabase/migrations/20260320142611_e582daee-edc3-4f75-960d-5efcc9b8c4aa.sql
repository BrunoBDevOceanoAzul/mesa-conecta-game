
-- 1. Add LGPD consent fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

-- 2. Mesa participants table (who joined/is in the mesa)
CREATE TABLE IF NOT EXISTS public.mesa_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mesa_id, user_id)
);

ALTER TABLE public.mesa_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mesa participants"
  ON public.mesa_participants FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can join mesas"
  ON public.mesa_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.mesa_participants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can leave mesas"
  ON public.mesa_participants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. Mesa feed posts table
CREATE TABLE IF NOT EXISTS public.mesa_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'message',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mesa_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mesa feed posts"
  ON public.mesa_feed_posts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can post in mesa feed"
  ON public.mesa_feed_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON public.mesa_feed_posts FOR UPDATE
  TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON public.mesa_feed_posts FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Enable realtime for mesa feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesa_feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesa_participants;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mesa_participants_mesa ON public.mesa_participants(mesa_id);
CREATE INDEX IF NOT EXISTS idx_mesa_feed_posts_mesa ON public.mesa_feed_posts(mesa_id, created_at DESC);
