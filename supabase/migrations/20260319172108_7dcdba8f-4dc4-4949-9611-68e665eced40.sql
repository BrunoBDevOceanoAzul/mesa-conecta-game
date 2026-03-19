
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, auth_provider, is_active, onboarding_completed, onboarding_step, can_play, can_gm)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    true,
    false,
    0,
    COALESCE((NEW.raw_user_meta_data->>'can_play')::boolean, true),
    COALESCE((NEW.raw_user_meta_data->>'can_gm')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
