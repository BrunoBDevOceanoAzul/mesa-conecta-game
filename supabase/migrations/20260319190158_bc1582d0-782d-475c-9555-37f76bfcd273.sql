
-- Add billing_cycles_remaining to user_discounts
ALTER TABLE public.user_discounts ADD COLUMN IF NOT EXISTS billing_cycles_remaining INTEGER;

-- Add source_reference_id to user_discounts
ALTER TABLE public.user_discounts ADD COLUMN IF NOT EXISTS source_reference_id UUID;

-- Add can_manage_store and can_manage_brand to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_store BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_brand BOOLEAN NOT NULL DEFAULT false;

-- Update existing store users to have can_manage_store = true
UPDATE public.profiles SET can_manage_store = true WHERE role = 'store';

-- Update existing brand users to have can_manage_brand = true  
UPDATE public.profiles SET can_manage_brand = true WHERE role = 'brand';

-- Update handle_new_user to also handle store/brand capabilities
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, email, name, role, auth_provider, is_active, 
    onboarding_completed, onboarding_step, 
    can_play, can_gm, can_manage_store, can_manage_brand
  )
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
    COALESCE((NEW.raw_user_meta_data->>'can_gm')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'can_manage_store')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'can_manage_brand')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
