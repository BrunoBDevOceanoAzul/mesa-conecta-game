
-- Credit wallets
CREATE TABLE public.credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  is_founder boolean NOT NULL DEFAULT false,
  founder_grants_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.credit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.credit_wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.credit_wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.credit_wallets FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update all wallets" ON public.credit_wallets FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER update_credit_wallets_updated_at BEFORE UPDATE ON public.credit_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'spend', 'founder_grant', 'refund')),
  description text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Boost campaigns
CREATE TABLE public.boost_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('mesa', 'post')),
  target_id uuid NOT NULL,
  target_title text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'draft')),
  budget_credits integer NOT NULL DEFAULT 0,
  spent_credits integer NOT NULL DEFAULT 0,
  cpc_rate numeric NOT NULL DEFAULT 0.50,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  reservations integer NOT NULL DEFAULT 0,
  segment_city text,
  segment_systems text[],
  segment_interests text[],
  is_founder_benefit boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boost_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.boost_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON public.boost_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.boost_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all campaigns" ON public.boost_campaigns FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update all campaigns" ON public.boost_campaigns FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER update_boost_campaigns_updated_at BEFORE UPDATE ON public.boost_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin settings (for CPC base rate etc)
CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings" ON public.admin_settings FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Insert default CPC setting
INSERT INTO public.admin_settings (key, value) VALUES ('cpc_base', '{"rate": 0.50, "currency": "BRL"}');
INSERT INTO public.admin_settings (key, value) VALUES ('founders_config', '{"max_founders": 20, "free_boosts_per_month": 3, "duration_months": 6}');
