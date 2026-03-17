
-- Subscriptions table to track active plans
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  plan_role text NOT NULL CHECK (plan_role IN ('gm', 'store')),
  price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Update credit_wallets: add founder tracking fields
ALTER TABLE public.credit_wallets
  ADD COLUMN IF NOT EXISTS founder_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS founder_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS free_boosts_per_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_boosts_used_current_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_month_reset timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS founder_rank integer;

-- Update boost_campaigns: add entity type tracking
ALTER TABLE public.boost_campaigns
  ADD COLUMN IF NOT EXISTS boosted_entity_type text DEFAULT 'mesa',
  ADD COLUMN IF NOT EXISTS requires_subscription boolean NOT NULL DEFAULT true;

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid, _plan_role text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND current_period_end > now()
      AND (_plan_role IS NULL OR plan_role = _plan_role)
  );
$$;
