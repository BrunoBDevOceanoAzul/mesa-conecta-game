
-- Add whatsapp column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- Update handle_new_user to capture whatsapp from signup metadata
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
    can_play, can_gm, can_manage_store, can_manage_brand, whatsapp
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
    COALESCE((NEW.raw_user_meta_data->>'can_manage_brand')::boolean, false),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''), '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
