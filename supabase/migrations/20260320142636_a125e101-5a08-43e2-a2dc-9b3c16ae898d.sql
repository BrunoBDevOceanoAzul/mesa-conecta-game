
-- Tighten mesa_participants INSERT to only allow if user_id matches
DROP POLICY IF EXISTS "Users can join mesas" ON public.mesa_participants;
CREATE POLICY "Users can join mesas"
  ON public.mesa_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tighten mesa_feed_posts INSERT
DROP POLICY IF EXISTS "Authenticated users can post in mesa feed" ON public.mesa_feed_posts;
CREATE POLICY "Authenticated users can post in mesa feed"
  ON public.mesa_feed_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);
