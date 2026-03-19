ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE POLICY "Stores can create mesas"
  ON public.mesas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);