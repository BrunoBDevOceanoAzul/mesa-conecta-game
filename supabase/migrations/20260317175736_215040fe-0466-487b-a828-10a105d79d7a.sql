
-- ══════════════════════════════════════════════════════════════
-- 1. Plans catalog
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  role text NOT NULL,
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL DEFAULT 0, -- cents
  currency text NOT NULL DEFAULT 'BRL',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Only admins can manage plans" ON public.plans FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════
-- 2. Payments table
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'manual',
  external_payment_id text,
  amount integer NOT NULL DEFAULT 0, -- cents
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL DEFAULT 'subscription',
  description text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_subscription ON public.payments(subscription_id);

-- ══════════════════════════════════════════════════════════════
-- 3. Enhance subscriptions table
-- ══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN canceled_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN provider text NOT NULL DEFAULT 'manual';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'external_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN external_subscription_id text;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 4. Seed plan catalog
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.plans (code, role, name, description, price_monthly, feature_flags, sort_order) VALUES
  ('player_adventurer', 'player', 'Passe Aventureiro', 'Até 2 reservas/mês, matchmaking inteligente, histórico de mesas, perfil de aderência.', 2490, '{"reservation_limit": 2, "matchmaking": true, "history": true, "profile_score": true}'::jsonb, 1),
  ('player_guild', 'player', 'Passe Guilda', 'Até 5 reservas/mês, prioridade em mesas lotadas, insígnia exclusiva, acesso antecipado a eventos.', 3990, '{"reservation_limit": 5, "matchmaking": true, "priority_booking": true, "exclusive_badge": true, "early_access": true}'::jsonb, 2),
  ('gm_pro', 'gm', 'Mestre Pro', 'Perfil profissional, mini CRM, agenda e reservas, analytics básico, até 3 mesas ativas.', 2990, '{"professional_profile": true, "crm": true, "analytics_basic": true, "max_active_mesas": 3, "boost_access": true}'::jsonb, 3),
  ('gm_pro_plus', 'gm', 'Mestre Pro+', 'Tudo do Pro + mesas ilimitadas, CRM avançado com tags, analytics completo, suporte prioritário.', 5990, '{"professional_profile": true, "crm": true, "crm_advanced": true, "analytics_full": true, "max_active_mesas": -1, "boost_access": true, "priority_support": true}'::jsonb, 4),
  ('store_base', 'store', 'Luderia Base', 'Até 4 mesas/mês, perfil da luderia, agenda pública, gestão de reservas.', 7990, '{"mesas_per_month": 4, "store_profile": true, "public_agenda": true, "reservations": true, "boost_access": true}'::jsonb, 5),
  ('store_growth', 'store', 'Luderia Growth', 'Até 12 mesas/mês, feed destacado, analytics avançado, suporte dedicado.', 14990, '{"mesas_per_month": 12, "store_profile": true, "public_agenda": true, "reservations": true, "feed_highlight": true, "analytics_full": true, "boost_access": true, "dedicated_support": true}'::jsonb, 6)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 5. Indexes
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_plans_role ON public.plans(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
