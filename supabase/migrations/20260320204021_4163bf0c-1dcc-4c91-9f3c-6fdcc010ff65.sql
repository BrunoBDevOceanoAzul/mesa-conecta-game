
-- Update check_feature_access to grant full access for 10 days after account creation
CREATE OR REPLACE FUNCTION public.check_feature_access(_feature_key text, _increment boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _role text;
  _plan_code text;
  _feature_flags jsonb;
  _limit int;
  _current_usage int;
  _period date := date_trunc('month', now())::date;
  _allowed boolean;
  _is_super boolean;
  _created_at timestamptz;
  _in_trial boolean;
BEGIN
  -- Super users bypass all limits
  SELECT public.is_super_user(_user_id) INTO _is_super;
  IF _is_super THEN
    RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1, 'remaining', -1);
  END IF;

  -- Check 10-day free trial period based on account creation
  SELECT created_at INTO _created_at FROM auth.users WHERE id = _user_id;
  _in_trial := (_created_at IS NOT NULL AND now() < _created_at + interval '10 days');

  IF _in_trial THEN
    IF _increment THEN
      INSERT INTO feature_usage (user_id, feature_key, period_start, usage_count, last_used_at)
      VALUES (_user_id, _feature_key, _period, 1, now())
      ON CONFLICT (user_id, feature_key, period_start)
      DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_used_at = now();
    END IF;
    RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1, 'remaining', -1);
  END IF;

  -- Get user role
  SELECT role INTO _role FROM profiles WHERE user_id = _user_id;

  -- Get active plan feature flags
  SELECT p.code, p.feature_flags::jsonb INTO _plan_code, _feature_flags
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id
    AND s.status = 'active'
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF _feature_flags IS NULL THEN
    _feature_flags := '{}'::jsonb;
  END IF;

  _limit := COALESCE(
    (_feature_flags ->> _feature_key)::int,
    CASE
      WHEN _feature_key = 'applications_per_month' AND _role = 'player' THEN 3
      WHEN _feature_key = 'active_mesas' AND _role = 'gm' THEN 1
      WHEN _feature_key = 'active_mesas' AND _role = 'store' THEN 2
      WHEN _feature_key = 'crm_access' THEN 0
      WHEN _feature_key = 'studio_access' THEN 0
      WHEN _feature_key = 'analytics_access' THEN 0
      WHEN _feature_key = 'cart_abandonment' THEN 0
      WHEN _feature_key = 'boost_campaigns' THEN 0
      ELSE 0
    END
  );

  IF _limit = -1 THEN
    IF _increment THEN
      INSERT INTO feature_usage (user_id, feature_key, period_start, usage_count, last_used_at)
      VALUES (_user_id, _feature_key, _period, 1, now())
      ON CONFLICT (user_id, feature_key, period_start)
      DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_used_at = now();
    END IF;
    RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1, 'remaining', -1);
  END IF;

  SELECT COALESCE(fu.usage_count, 0) INTO _current_usage
  FROM feature_usage fu
  WHERE fu.user_id = _user_id
    AND fu.feature_key = _feature_key
    AND fu.period_start = _period;

  IF _current_usage IS NULL THEN _current_usage := 0; END IF;
  _allowed := _current_usage < _limit;

  IF _allowed AND _increment THEN
    INSERT INTO feature_usage (user_id, feature_key, period_start, usage_count, last_used_at)
    VALUES (_user_id, _feature_key, _period, 1, now())
    ON CONFLICT (user_id, feature_key, period_start)
    DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_used_at = now();
    _current_usage := _current_usage + 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', _allowed,
    'usage', _current_usage,
    'limit', _limit,
    'remaining', GREATEST(0, _limit - _current_usage)
  );
END;
$function$;

-- RPC to check if user is in trial period
CREATE OR REPLACE FUNCTION public.get_trial_status(_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'in_trial', (now() < u.created_at + interval '10 days'),
    'trial_ends_at', (u.created_at + interval '10 days')::text,
    'days_remaining', GREATEST(0, EXTRACT(DAY FROM (u.created_at + interval '10 days' - now())))::int
  )
  FROM auth.users u
  WHERE u.id = _user_id;
$function$;
