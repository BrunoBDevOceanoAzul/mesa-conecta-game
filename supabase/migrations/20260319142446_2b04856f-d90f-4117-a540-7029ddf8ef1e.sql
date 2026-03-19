
-- Community posts table
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_role text NOT NULL DEFAULT 'gm',
  post_type text NOT NULL DEFAULT 'organic',
  title text,
  content text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'published',
  is_sponsored boolean NOT NULL DEFAULT false,
  sponsor_label text,
  related_table_id uuid REFERENCES public.game_tables(id) ON DELETE SET NULL,
  related_store_id uuid,
  related_gm_id uuid,
  cta_text text,
  cta_url text,
  tags text[] DEFAULT '{}',
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_community_posts_author ON public.community_posts(author_id);
CREATE INDEX idx_community_posts_status ON public.community_posts(status);
CREATE INDEX idx_community_posts_type ON public.community_posts(post_type);
CREATE INDEX idx_community_posts_published ON public.community_posts(published_at DESC);
CREATE INDEX idx_community_posts_sponsored ON public.community_posts(is_sponsored) WHERE is_sponsored = true;

-- RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Anyone can view published posts"
  ON public.community_posts FOR SELECT
  TO public
  USING (status = 'published');

-- Authors can manage own posts
CREATE POLICY "Authors can insert own posts"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON public.community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Admins full access
CREATE POLICY "Admins manage all posts"
  ON public.community_posts FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Post likes table
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.post_likes FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
