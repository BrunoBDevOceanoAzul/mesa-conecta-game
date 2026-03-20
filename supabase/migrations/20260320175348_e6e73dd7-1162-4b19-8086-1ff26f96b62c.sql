
-- Ambassadors table for homepage section
CREATE TABLE public.ambassadors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role_label TEXT NOT NULL DEFAULT 'Mestre',
  avatar_url TEXT,
  profile_slug TEXT,
  profile_type TEXT DEFAULT 'gm',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

-- Public read for homepage
CREATE POLICY "Anyone can view active ambassadors"
  ON public.ambassadors FOR SELECT
  USING (is_active = true);

-- Admin can manage
CREATE POLICY "Admins can manage ambassadors"
  ON public.ambassadors FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ambassadors_updated_at
  BEFORE UPDATE ON public.ambassadors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
