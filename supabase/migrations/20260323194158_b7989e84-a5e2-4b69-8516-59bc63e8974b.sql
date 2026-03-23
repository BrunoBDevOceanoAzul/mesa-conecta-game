
-- Fix check_feature_access: match subscription to plan by name (plan_id is often null)
-- Also map 'applications_per_month' to 'reservation_limit' feature flag
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
  _flag_key text;
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

  -- Get active subscription feature flags
  -- Try plan_id first, then fallback to matching plan_name to plans.name
  SELECT p.code, p.feature_flags::jsonb INTO _plan_code, _feature_flags
  FROM subscriptions s
  LEFT JOIN plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id
    AND s.status = 'active'
    AND s.current_period_end > now()
    AND p.id IS NOT NULL
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Fallback: match by plan_name if plan_id was null
  IF _feature_flags IS NULL THEN
    SELECT p.code, p.feature_flags::jsonb INTO _plan_code, _feature_flags
    FROM subscriptions s
    JOIN plans p ON lower(p.name) = lower(s.plan_name) OR lower(p.code) = lower(s.plan_name)
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND s.current_period_end > now()
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  IF _feature_flags IS NULL THEN
    _feature_flags := '{}'::jsonb;
  END IF;

  -- Map feature keys to their flag names in the plans table
  _flag_key := CASE
    WHEN _feature_key = 'applications_per_month' THEN 'reservation_limit'
    WHEN _feature_key = 'active_mesas' THEN 'max_active_mesas'
    WHEN _feature_key = 'crm_access' THEN 'crm'
    WHEN _feature_key = 'studio_access' THEN 'ai_text_assist'
    WHEN _feature_key = 'analytics_access' THEN 'analytics_basic'
    WHEN _feature_key = 'cart_abandonment' THEN 'cart_abandonment'
    WHEN _feature_key = 'boost_campaigns' THEN 'boost_access'
    ELSE _feature_key
  END;

  -- For boolean flags (crm, analytics, boost), treat true as unlimited
  IF _feature_flags ? _flag_key AND jsonb_typeof(_feature_flags -> _flag_key) = 'boolean' THEN
    IF (_feature_flags ->> _flag_key)::boolean THEN
      IF _increment THEN
        INSERT INTO feature_usage (user_id, feature_key, period_start, usage_count, last_used_at)
        VALUES (_user_id, _feature_key, _period, 1, now())
        ON CONFLICT (user_id, feature_key, period_start)
        DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_used_at = now();
      END IF;
      RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1, 'remaining', -1);
    ELSE
      RETURN jsonb_build_object('allowed', false, 'usage', 0, 'limit', 0, 'remaining', 0);
    END IF;
  END IF;

  -- For string flags like ai_text_assist = 'basic'/'full', treat as allowed
  IF _feature_flags ? _flag_key AND jsonb_typeof(_feature_flags -> _flag_key) = 'string' THEN
    IF _increment THEN
      INSERT INTO feature_usage (user_id, feature_key, period_start, usage_count, last_used_at)
      VALUES (_user_id, _feature_key, _period, 1, now())
      ON CONFLICT (user_id, feature_key, period_start)
      DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_used_at = now();
    END IF;
    RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1, 'remaining', -1);
  END IF;

  _limit := COALESCE(
    (_feature_flags ->> _flag_key)::int,
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
