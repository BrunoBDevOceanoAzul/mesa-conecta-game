
-- ═══════════════════════════════════════════════════════════
-- PRODUCTION HARDENING: Indexes, Unique Constraints, Validations
-- ═══════════════════════════════════════════════════════════

-- 1. SUBSCRIPTIONS: Prevent duplicate Stripe subscription records
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_stripe_sub_id 
  ON public.subscriptions (stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON public.subscriptions (user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON public.subscriptions (status);

-- Index for period end (expiration checks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end 
  ON public.subscriptions (current_period_end);

-- 2. PAYMENTS: Prevent duplicate invoice records
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_invoice 
  ON public.payments (stripe_invoice_id) 
  WHERE stripe_invoice_id IS NOT NULL;

-- Prevent duplicate charge records (refunds)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_charge 
  ON public.payments (stripe_charge_id, payment_type) 
  WHERE stripe_charge_id IS NOT NULL;

-- 3. WEBHOOK_EVENTS: Ensure idempotency key is unique
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_id 
  ON public.webhook_events (id);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at 
  ON public.webhook_events (processed_at);

-- 4. PROFILES: Index on email for webhook resolver
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles (email);

-- 5. GAME_TABLES: Index for common queries
CREATE INDEX IF NOT EXISTS idx_game_tables_gm_user_id 
  ON public.game_tables (gm_user_id);

CREATE INDEX IF NOT EXISTS idx_game_tables_status 
  ON public.game_tables (status);

CREATE INDEX IF NOT EXISTS idx_game_tables_city 
  ON public.game_tables (city);

-- 6. MESAS: Index for status and city filtering
CREATE INDEX IF NOT EXISTS idx_mesas_status 
  ON public.mesas (status);

CREATE INDEX IF NOT EXISTS idx_mesas_city 
  ON public.mesas (city);

CREATE INDEX IF NOT EXISTS idx_mesas_gm_id 
  ON public.mesas (gm_id);

-- 7. COUPON_REDEMPTIONS: Prevent double redemption
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupon_redemptions_user_coupon 
  ON public.coupon_redemptions (user_id, coupon_id);

-- 8. DISCOUNT_COUPONS: Unique public code
CREATE UNIQUE INDEX IF NOT EXISTS uq_discount_coupons_public_code 
  ON public.discount_coupons (public_code);

-- 9. CREDIT_TRANSACTIONS: Index for user lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
  ON public.credit_transactions (user_id);

-- 10. FOUNDER_BENEFITS: One record per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_founder_benefits_user 
  ON public.founder_benefits (user_id);

-- 11. NOTIFICATIONS: Index for user + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications (user_id, is_read);

-- 12. ONBOARDING_SESSIONS: One active session per user+role
CREATE UNIQUE INDEX IF NOT EXISTS uq_onboarding_user_role 
  ON public.onboarding_sessions (user_id, role);

-- 13. MASTER_XP_PROFILES: One per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_xp_user 
  ON public.master_xp_profiles (user_id);

-- 14. GM_PROFILES / PLAYER_PROFILES: One per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_profiles_user 
  ON public.gm_profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_player_profiles_user 
  ON public.player_profiles (user_id);

-- 15. AUDIT_LOG: Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON public.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor 
  ON public.audit_log (actor_id);

-- 16. BOOST_USAGE_LOGS: Index for user lookups
CREATE INDEX IF NOT EXISTS idx_boost_usage_user 
  ON public.boost_usage_logs (user_id);

-- 17. BILLING_PROFILES: One per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_profiles_user 
  ON public.billing_profiles (user_id);
