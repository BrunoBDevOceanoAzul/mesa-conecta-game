-- Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_json jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'processed',
  error_message text
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage webhook events"
  ON public.webhook_events FOR ALL
  TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Audit log table for critical operations
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  actor_id uuid,
  actor_email text,
  target_type text,
  target_id text,
  details_json jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  source text NOT NULL DEFAULT 'system'
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert audit log"
  ON public.audit_log FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role'::text);

-- Critical indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice_id ON public.payments(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON public.connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_id ON public.connected_accounts(stripe_connected_account_id);
CREATE INDEX IF NOT EXISTS idx_game_tables_gm_user_id ON public.game_tables(gm_user_id);
CREATE INDEX IF NOT EXISTS idx_game_tables_status ON public.game_tables(status);
CREATE INDEX IF NOT EXISTS idx_bookings_player ON public.bookings(player_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gm ON public.bookings(gm_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_wallets_user_id ON public.credit_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_campaigns_user_id ON public.boost_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_public_code ON public.discount_coupons(public_code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_plans_code ON public.plans(code);
CREATE INDEX IF NOT EXISTS idx_plans_stripe_price ON public.plans(stripe_price_id);

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_connected_accounts_user ON public.connected_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_wallets_user ON public.credit_wallets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_profiles_user ON public.gm_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_player_profiles_user ON public.player_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_profiles_user ON public.billing_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_plans_code ON public.plans(code);