
-- Create mesas (RPG tables) table
CREATE TABLE public.mesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  system TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('one-shot', 'campanha', 'evento')),
  format TEXT NOT NULL CHECK (format IN ('presencial', 'online', 'híbrido')),
  city TEXT,
  venue TEXT,
  min_price NUMERIC(10,2) DEFAULT 0,
  max_price NUMERIC(10,2) DEFAULT 0,
  seats_total INTEGER NOT NULL DEFAULT 5,
  seats_available INTEGER NOT NULL DEFAULT 5,
  gm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gm_name TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'lotada', 'encerrada', 'cancelada')),
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  play_styles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

-- Mesas are publicly viewable
CREATE POLICY "Mesas are publicly viewable"
  ON public.mesas FOR SELECT
  USING (true);

-- GMs can create their own mesas
CREATE POLICY "GMs can create mesas"
  ON public.mesas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = gm_id);

-- GMs or admins can update mesas
CREATE POLICY "GMs or admins can update mesas"
  ON public.mesas FOR UPDATE
  TO authenticated
  USING (auth.uid() = gm_id OR public.is_admin(auth.uid()));

-- GMs or admins can delete mesas
CREATE POLICY "GMs or admins can delete mesas"
  ON public.mesas FOR DELETE
  TO authenticated
  USING (auth.uid() = gm_id OR public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_mesas_updated_at
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add preferences columns to profiles for matchmaking
ALTER TABLE public.profiles
  ADD COLUMN preferred_systems TEXT[] DEFAULT '{}',
  ADD COLUMN play_styles TEXT[] DEFAULT '{}',
  ADD COLUMN experience_level TEXT,
  ADD COLUMN preferred_format TEXT,
  ADD COLUMN budget_range TEXT;
