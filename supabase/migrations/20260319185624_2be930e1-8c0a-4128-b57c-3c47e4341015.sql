
-- 1. Update handle_new_user to NOT default to 'player' — use NULL so the system knows role hasn't been chosen yet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, auth_provider, is_active, onboarding_completed, onboarding_step, can_play, can_gm)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'role', ''), ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    true,
    false,
    0,
    COALESCE((NEW.raw_user_meta_data->>'can_play')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'can_gm')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Create user_discounts table for manual and coupon-based discounts
CREATE TABLE IF NOT EXISTS public.user_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discount_coupon_id UUID REFERENCES public.discount_coupons(id) ON DELETE SET NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  percent_off NUMERIC,
  amount_off NUMERIC,
  currency TEXT DEFAULT 'brl',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  duration_type TEXT NOT NULL DEFAULT 'once',
  duration_in_months INTEGER,
  applies_to_plan_id UUID,
  applies_to_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_type TEXT NOT NULL DEFAULT 'admin',
  notes TEXT,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all discounts
CREATE POLICY "Admins can manage user_discounts"
  ON public.user_discounts
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Users can read their own discounts
CREATE POLICY "Users can read own discounts"
  ON public.user_discounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_discounts_updated_at
  BEFORE UPDATE ON public.user_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
