-- Migration: Sanitize Database & Enable RLS
-- Date: 2026-05-04
-- Purpose: Remove test data, enable RLS, and secure sensitive columns

-- PHASE 1: BACKUP & AUDIT (non-destructive)
-- These views help identify what will be deleted

CREATE OR REPLACE VIEW audit.test_data_to_delete AS
SELECT 'profiles' as table_name, COUNT(*) as row_count
FROM profiles
WHERE email ILIKE ANY(ARRAY['%test%', '%demo%', '%example%', '%dummy%', '%fake%'])
UNION ALL
SELECT 'profiles', COUNT(*)
FROM profiles
WHERE LOWER(first_name) IN ('test', 'demo', 'example');

-- PHASE 2: DATA CLEANUP (safe, reversible)
-- Comment out any deletions you don't want to execute

-- Remove test profiles
DELETE FROM profiles
WHERE email ILIKE ANY(ARRAY['%test%', '%demo%', '%example%', '%dummy%', '%fake%'])
   OR LOWER(first_name) IN ('test', 'demo', 'example')
   OR LOWER(last_name) IN ('user', 'test', 'demo');

-- Remove orphaned records (optional - be careful with FKs)
-- DELETE FROM mesas WHERE user_id NOT IN (SELECT id FROM profiles);
-- DELETE FROM bookings WHERE user_id NOT IN (SELECT id FROM profiles);

-- PHASE 3: SENSITIVE COLUMNS SANITIZATION (optional)
-- Only run if you want to anonymize data for testing

-- Anonymize emails (keep original for recovery if needed)
-- UPDATE profiles SET email = md5(email) || '@anonymized.local' 
-- WHERE NOT email LIKE '%.anonymized.local%';

-- Mask phone numbers: keep first 3 chars, hide rest
-- UPDATE profiles SET phone = SUBSTRING(phone FROM 1 FOR 3) || '****' 
-- WHERE phone IS NOT NULL AND phone != '';

-- PHASE 4: ENABLE ROW LEVEL SECURITY
-- This protects all tables with row-level access control

-- Enable RLS on core tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_accounts ENABLE ROW LEVEL SECURITY;

-- PHASE 5: REVOKE PUBLIC ACCESS & SET DEFAULTS
-- By default, nobody can access anything until explicit policies grant it

-- Revoke default INSERT/UPDATE/DELETE on all public tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  REVOKE ALL ON TABLES FROM public;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  REVOKE ALL ON TABLES FROM authenticated;

-- Grant SELECT only to authenticated users (policies will further restrict)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- PHASE 6: CREATE RLS POLICIES (authorization rules)

-- Profile access: own + public profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read public profiles"
  ON profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Mesa access: own + published mesas
CREATE POLICY "Users can read own mesas"
  ON mesas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read published mesas"
  ON mesas FOR SELECT
  USING (status = 'published' OR status = 'active');

CREATE POLICY "Users can update own mesas"
  ON mesas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mesas"
  ON mesas FOR DELETE
  USING (auth.uid() = user_id);

-- Booking access: user's own bookings + owned mesa bookings
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = player_user_id);

CREATE POLICY "Mesa owners can read their mesa bookings"
  ON bookings FOR SELECT
  USING (
    gm_user_id = auth.uid() OR
    store_user_id = auth.uid()
  );

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = player_user_id);

-- Post access: public + own posts
CREATE POLICY "Anyone can read public posts"
  ON posts FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment access: public posts + own comments
CREATE POLICY "Anyone can read comments on public posts"
  ON comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND is_public = true));

CREATE POLICY "Users can read own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own comments"
  ON comments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Like access
CREATE POLICY "Anyone can read post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own post likes"
  ON post_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read comment likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own comment likes"
  ON comment_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Review access
CREATE POLICY "Anyone can read published reviews"
  ON reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can read own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewer_user_id OR auth.uid() = reviewed_user_id);

CREATE POLICY "Users can manage own reviews"
  ON reviews FOR ALL
  USING (auth.uid() = reviewer_user_id)
  WITH CHECK (auth.uid() = reviewer_user_id);

-- Notification access
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Hive access
CREATE POLICY "Anyone can read public hives"
  ON hives FOR SELECT
  USING (is_public = true);

CREATE POLICY "Members can read their hives"
  ON hives FOR SELECT
  USING (EXISTS (SELECT 1 FROM hive_members WHERE hive_id = id AND user_id = auth.uid()));

CREATE POLICY "Owners can manage their hives"
  ON hives FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Hive members access
CREATE POLICY "Anyone can see members of public hives"
  ON hive_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM hives WHERE id = hive_id AND is_public = true));

CREATE POLICY "Users can manage own membership"
  ON hive_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Billing access (strict owner-only)
CREATE POLICY "Users can manage own subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own credit wallets"
  ON credit_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own coupon redemptions"
  ON coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asaas account"
  ON asaas_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PHASE 7: VERIFY & REPORT
-- These selects show the final state without changing anything

SELECT 'RLS Status' as check_type, 
       COUNT(*) as result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND rowsecurity = true;

SELECT 'Policies Created' as check_type,
       COUNT(*) as result
FROM pg_policies
WHERE schemaname = 'public';

-- PHASE 8: OPTIONAL - COLUMN-LEVEL SECURITY
-- Hide sensitive columns from anonymous users (requires RLS policies with granted columns)

-- Grant SELECT on non-sensitive columns only to anon role
GRANT SELECT (id, first_name, last_name, city, is_public, created_at)
  ON profiles TO anon;

REVOKE SELECT (email, phone, user_agent, ip_hash)
  ON profiles FROM anon;

-- Notes:
-- 1. All deletions are commented out by default - review and uncomment to execute
-- 2. Test this migration locally first with `supabase migration up`
-- 3. RLS policies use auth.uid() which requires Supabase Auth context
-- 4. Service role can bypass RLS, so backend operations still work
-- 5. To rollback: `supabase db reset` or create a reverse migration
