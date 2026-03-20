
-- Add google_place_id and state columns to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS state TEXT;

-- Allow admins to insert stores (currently only owner can insert their own)
CREATE POLICY "Admins can insert stores"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to delete stores
DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
