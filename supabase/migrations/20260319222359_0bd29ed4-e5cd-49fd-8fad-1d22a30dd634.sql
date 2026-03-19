
CREATE TABLE public.admin_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  channels TEXT[] NOT NULL DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT DEFAULT 'social',
  utm_campaign TEXT,
  utm_content TEXT DEFAULT 'admin_publish',
  clicks INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ai_generated_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage share links"
  ON public.admin_share_links
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read active share links"
  ON public.admin_share_links
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
