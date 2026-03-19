
-- Add slug to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_posts_slug ON public.community_posts(slug) WHERE slug IS NOT NULL;

-- Post comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published comments"
  ON public.post_comments FOR SELECT TO public
  USING (status = 'published');

CREATE POLICY "Users can insert own comments"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (auth.uid() = author_user_id);

CREATE POLICY "Admins manage all comments"
  ON public.post_comments FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Post share links for UTM tracking
CREATE TABLE public.post_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  owner_user_id uuid,
  channel text NOT NULL,
  utm_source text,
  utm_medium text DEFAULT 'social',
  utm_campaign text,
  utm_content text,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_share_links_post ON public.post_share_links(post_id);
ALTER TABLE public.post_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view share links"
  ON public.post_share_links FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert share links"
  ON public.post_share_links FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update share link clicks"
  ON public.post_share_links FOR UPDATE TO public USING (true);

-- Triggers
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
