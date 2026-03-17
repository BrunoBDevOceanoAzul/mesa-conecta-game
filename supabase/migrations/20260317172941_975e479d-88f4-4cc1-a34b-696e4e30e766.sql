
-- boost_usage_logs: Track every boost usage for audit
CREATE TABLE public.boost_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  boost_campaign_id uuid REFERENCES public.boost_campaigns(id) ON DELETE SET NULL,
  usage_type text NOT NULL CHECK (usage_type IN ('free_monthly_boost', 'paid_boost')),
  credits_spent integer NOT NULL DEFAULT 0,
  founder_benefit_used boolean NOT NULL DEFAULT false,
  billing_reference text,
  used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boost_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON public.boost_usage_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.boost_usage_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" ON public.boost_usage_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- DB function: can_use_boost (for RLS and backend validation)
CREATE OR REPLACE FUNCTION public.can_use_boost(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND p.role IN ('gm', 'store')
      AND s.status = 'active'
      AND s.current_period_end > now()
  );
$$;

-- DB function: can_use_founder_boost
CREATE OR REPLACE FUNCTION public.can_use_founder_boost(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.user_id
    JOIN public.credit_wallets w ON w.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND p.role = 'gm'
      AND s.status = 'active'
      AND s.current_period_end > now()
      AND w.is_founder = true
      AND w.founder_expires_at > now()
      AND w.free_boosts_used_current_month < w.free_boosts_per_month
  );
$$;

-- Add campaign_source column to boost_campaigns if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boost_campaigns' AND column_name = 'campaign_source'
  ) THEN
    ALTER TABLE public.boost_campaigns ADD COLUMN campaign_source text NOT NULL DEFAULT 'paid_credit';
  END IF;
END $$;

-- Add duration_days column to boost_campaigns if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boost_campaigns' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE public.boost_campaigns ADD COLUMN duration_days integer NOT NULL DEFAULT 7;
  END IF;
END $$;

-- Tighten boost_campaigns INSERT policy to require eligibility
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.boost_campaigns;
CREATE POLICY "Users can insert own campaigns" ON public.boost_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND can_use_boost(auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_boost_usage_logs_user ON public.boost_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_usage_logs_campaign ON public.boost_usage_logs(boost_campaign_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
