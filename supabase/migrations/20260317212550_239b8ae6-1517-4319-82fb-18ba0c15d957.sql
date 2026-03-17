
-- =============================================
-- 1. connected_accounts
-- =============================================
CREATE TABLE public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL,
  stripe_connected_account_id text UNIQUE,
  stripe_account_type text NOT NULL DEFAULT 'express',
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  onboarding_status text NOT NULL DEFAULT 'not_started',
  onboarding_url text,
  country text NOT NULL DEFAULT 'BR',
  currency text NOT NULL DEFAULT 'BRL',
  capabilities_json jsonb NOT NULL DEFAULT '{}',
  requirements_json jsonb NOT NULL DEFAULT '{}',
  application_fee_percent numeric NOT NULL DEFAULT 10,
  platform_fee_amount integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected account"
  ON public.connected_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage connected accounts"
  ON public.connected_accounts FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. discount_coupons
-- =============================================
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin_user_id uuid NOT NULL,
  internal_name text NOT NULL,
  public_code text NOT NULL UNIQUE,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  discount_type text NOT NULL DEFAULT 'percent',
  percent_off numeric,
  amount_off integer,
  currency text NOT NULL DEFAULT 'BRL',
  duration_type text NOT NULL DEFAULT 'once',
  duration_in_months integer,
  applies_to_roles_json jsonb NOT NULL DEFAULT '[]',
  applies_to_plan_ids_json jsonb NOT NULL DEFAULT '[]',
  applies_to_credit_packages_json jsonb NOT NULL DEFAULT '[]',
  max_redemptions integer,
  max_redemptions_per_user integer NOT NULL DEFAULT 1,
  first_time_customer_only boolean NOT NULL DEFAULT false,
  minimum_amount integer,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons"
  ON public.discount_coupons FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated can read active coupons"
  ON public.discount_coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. coupon_redemptions
-- =============================================
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.discount_coupons(id),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  payment_id uuid REFERENCES public.payments(id),
  stripe_discount_id text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  discount_amount_applied integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage redemptions"
  ON public.coupon_redemptions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_coupon_redemptions_updated_at
  BEFORE UPDATE ON public.coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
