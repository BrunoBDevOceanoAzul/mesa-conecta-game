
-- =============================================
-- HIVIUM SaaS Database - Complete Restructure
-- =============================================

-- 1) ENUMS
DO $$ BEGIN
  CREATE TYPE public.billing_interval AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'expired', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'canceled', 'completed', 'refunded', 'waitlist');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2) ALTER EXISTING TABLES
-- =============================================

-- profiles: add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS badge_summary_text text,
  ADD COLUMN IF NOT EXISTS current_title text,
  ADD COLUMN IF NOT EXISTS preferences_summary text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug) WHERE slug IS NOT NULL;

-- plans: add new columns
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS billing_interval public.billing_interval DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS interval_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS limits_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- subscriptions: add new columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS billing_interval public.billing_interval DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true;

-- payments: add new columns
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS metadata_json jsonb DEFAULT '{}'::jsonb;

-- master_xp_profiles: add new columns
ALTER TABLE public.master_xp_profiles
  ADD COLUMN IF NOT EXISTS xp_to_next_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_xp_at timestamptz;

-- xp_events: add description
ALTER TABLE public.xp_events
  ADD COLUMN IF NOT EXISTS description text;

-- badge_definitions: add is_founder_badge
ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS is_founder_badge boolean DEFAULT false;

-- boost_campaigns: add missing columns
ALTER TABLE public.boost_campaigns
  ADD COLUMN IF NOT EXISTS campaign_name text,
  ADD COLUMN IF NOT EXISTS ctr numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_filters_json jsonb DEFAULT '{}'::jsonb;

-- =============================================
-- 3) NEW TABLES - Role-specific profiles
-- =============================================

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_level text,
  budget_min numeric DEFAULT 0,
  budget_max numeric DEFAULT 0,
  format_preference text DEFAULT 'mixed',
  prefers_one_shot boolean DEFAULT false,
  prefers_campaign boolean DEFAULT false,
  availability_json jsonb DEFAULT '[]'::jsonb,
  preferred_systems_json jsonb DEFAULT '[]'::jsonb,
  preferred_styles_json jsonb DEFAULT '[]'::jsonb,
  themes_like_json jsonb DEFAULT '[]'::jsonb,
  themes_avoid_json jsonb DEFAULT '[]'::jsonb,
  reservation_limit_per_cycle integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  narrative_style_json jsonb DEFAULT '[]'::jsonb,
  systems_mastered_json jsonb DEFAULT '[]'::jsonb,
  price_min numeric DEFAULT 0,
  price_max numeric DEFAULT 0,
  max_players_default integer DEFAULT 5,
  beginner_friendly boolean DEFAULT true,
  supports_corporate boolean DEFAULT false,
  supports_therapeutic boolean DEFAULT false,
  supports_educational boolean DEFAULT false,
  accepted_formats_json jsonb DEFAULT '[]'::jsonb,
  availability_json jsonb DEFAULT '[]'::jsonb,
  reputation_score numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_tables integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  occupancy_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_name text,
  legal_name text,
  document_number text,
  address_line text,
  address_number text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  latitude double precision,
  longitude double precision,
  capacity_total integer,
  simultaneous_tables integer,
  average_ticket numeric,
  operation_days_json jsonb DEFAULT '[]'::jsonb,
  games_catalog_json jsonb DEFAULT '[]'::jsonb,
  structure_features_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  category text,
  monthly_budget numeric,
  target_audience_json jsonb DEFAULT '[]'::jsonb,
  campaign_goal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 4) Onboarding
-- =============================================

CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  current_step integer DEFAULT 0,
  progress_percent integer DEFAULT 0,
  answers_json jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code text NOT NULL,
  badge_name text NOT NULL,
  badge_type text DEFAULT 'anamnese',
  badge_description text,
  visual_theme jsonb DEFAULT '{}'::jsonb,
  awarded_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 5) Subscription Events
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  previous_plan_id uuid REFERENCES public.plans(id),
  new_plan_id uuid REFERENCES public.plans(id),
  source text DEFAULT 'system',
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 6) Billing Profiles
-- =============================================

CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company_name text,
  tax_document text,
  billing_email text,
  billing_phone text,
  country text DEFAULT 'BR',
  state text,
  city text,
  zip_code text,
  address_line text,
  address_number text,
  neighborhood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 7) Wallets (new structure replacing credit_wallets)
-- =============================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type text DEFAULT 'credits',
  balance integer DEFAULT 0,
  currency text DEFAULT 'BRL',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount integer NOT NULL,
  balance_before integer DEFAULT 0,
  balance_after integer DEFAULT 0,
  reference_type text,
  reference_id uuid,
  description text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  credits_amount integer NOT NULL,
  price_amount integer NOT NULL,
  currency text DEFAULT 'BRL',
  stripe_price_id text,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 8) Founder Benefits
-- =============================================

CREATE TABLE IF NOT EXISTS public.founder_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_rank integer NOT NULL,
  is_founder boolean DEFAULT true,
  founder_started_at timestamptz DEFAULT now(),
  founder_expires_at timestamptz,
  free_boosts_per_month integer DEFAULT 2,
  free_boosts_used_current_month integer DEFAULT 0,
  monthly_reset_reference timestamptz DEFAULT now(),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 9) CRM
-- =============================================

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_user_id uuid REFERENCES auth.users(id),
  display_name text,
  email text,
  phone text,
  source_type text DEFAULT 'manual',
  source_reference_id uuid,
  stage text DEFAULT 'new',
  tags_json jsonb DEFAULT '[]'::jsonb,
  notes text,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  gm_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  content text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 10) Game Tables & Bookings
-- =============================================

CREATE TABLE IF NOT EXISTS public.game_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  slug text,
  description text,
  system_name text NOT NULL,
  session_type text DEFAULT 'one_shot',
  play_format text DEFAULT 'presencial',
  city text,
  venue_name text,
  address_text text,
  start_at timestamptz,
  end_at timestamptz,
  timezone text DEFAULT 'America/Sao_Paulo',
  min_price numeric DEFAULT 0,
  max_price numeric DEFAULT 0,
  seats_total integer DEFAULT 5,
  seats_available integer DEFAULT 5,
  status text DEFAULT 'draft',
  match_tags_json jsonb DEFAULT '[]'::jsonb,
  onboarding_fit_json jsonb DEFAULT '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id uuid NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  sequence_number integer DEFAULT 1,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_table_id uuid NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  table_session_id uuid REFERENCES public.table_sessions(id),
  player_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gm_user_id uuid NOT NULL REFERENCES auth.users(id),
  store_user_id uuid REFERENCES auth.users(id),
  status public.booking_status DEFAULT 'pending',
  seats_reserved integer DEFAULT 1,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  payment_status text DEFAULT 'unpaid',
  booked_at timestamptz DEFAULT now(),
  canceled_at timestamptz,
  completed_at timestamptz,
  source_type text DEFAULT 'organic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  review_type text DEFAULT 'gm',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 11) Posts, Feed & Campaigns
-- =============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  post_type text DEFAULT 'organic',
  title text,
  content text,
  image_url text,
  video_url text,
  status text DEFAULT 'draft',
  sponsored_label text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_role text,
  campaign_type text DEFAULT 'internal',
  title text NOT NULL,
  objective text,
  target_audience_json jsonb DEFAULT '{}'::jsonb,
  budget_amount numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  start_at timestamptz,
  end_at timestamptz,
  status text DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 12) Notifications
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text,
  action_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 13) Admin / Audit
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  notes text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value_json jsonb DEFAULT '{}'::jsonb,
  updated_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 14) RLS - Enable on all new tables
-- =============================================

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 15) RLS POLICIES
-- =============================================

-- Role-specific profiles: user owns, public read, admin manage
CREATE POLICY "Users can view own player profile" ON public.player_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own player profile" ON public.player_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player profile" ON public.player_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage player profiles" ON public.player_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own gm profile" ON public.gm_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view gm profiles" ON public.gm_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own gm profile" ON public.gm_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gm profile" ON public.gm_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage gm profiles" ON public.gm_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own store profile" ON public.store_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view store profiles" ON public.store_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own store profile" ON public.store_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own store profile" ON public.store_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage store profiles" ON public.store_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own brand profile" ON public.brand_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand profile" ON public.brand_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand profile" ON public.brand_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage brand profiles" ON public.brand_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Onboarding
CREATE POLICY "Users can view own onboarding" ON public.onboarding_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON public.onboarding_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage onboarding" ON public.onboarding_sessions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Profile badges
CREATE POLICY "Anyone can view profile badges" ON public.profile_badges FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own badges" ON public.profile_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage profile badges" ON public.profile_badges FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Subscription events
CREATE POLICY "Users can view own sub events" ON public.subscription_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage sub events" ON public.subscription_events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Billing profiles
CREATE POLICY "Users can view own billing" ON public.billing_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing" ON public.billing_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing" ON public.billing_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage billing" ON public.billing_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage wallets" ON public.wallets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Wallet transactions
CREATE POLICY "Users can view own wallet txns" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet txns" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage wallet txns" ON public.wallet_transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Credit packages: public read
CREATE POLICY "Anyone can view credit packages" ON public.credit_packages FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage credit packages" ON public.credit_packages FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Founder benefits
CREATE POLICY "Users can view own founder" ON public.founder_benefits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage founders" ON public.founder_benefits FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- CRM
CREATE POLICY "GMs can view own contacts" ON public.crm_contacts FOR SELECT USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can insert own contacts" ON public.crm_contacts FOR INSERT WITH CHECK (auth.uid() = gm_user_id);
CREATE POLICY "GMs can update own contacts" ON public.crm_contacts FOR UPDATE USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can delete own contacts" ON public.crm_contacts FOR DELETE USING (auth.uid() = gm_user_id);
CREATE POLICY "Admins manage crm contacts" ON public.crm_contacts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "GMs can view own interactions" ON public.crm_interactions FOR SELECT USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can insert own interactions" ON public.crm_interactions FOR INSERT WITH CHECK (auth.uid() = gm_user_id);
CREATE POLICY "Admins manage crm interactions" ON public.crm_interactions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "GMs can view own pipelines" ON public.crm_pipelines FOR SELECT USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can insert own pipelines" ON public.crm_pipelines FOR INSERT WITH CHECK (auth.uid() = gm_user_id);
CREATE POLICY "GMs can update own pipelines" ON public.crm_pipelines FOR UPDATE USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can delete own pipelines" ON public.crm_pipelines FOR DELETE USING (auth.uid() = gm_user_id);
CREATE POLICY "Admins manage pipelines" ON public.crm_pipelines FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Pipeline stages viewable by pipeline owner" ON public.crm_pipeline_stages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND p.gm_user_id = auth.uid())
);
CREATE POLICY "Pipeline stages insertable by owner" ON public.crm_pipeline_stages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND p.gm_user_id = auth.uid())
);
CREATE POLICY "Pipeline stages updatable by owner" ON public.crm_pipeline_stages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND p.gm_user_id = auth.uid())
);
CREATE POLICY "Pipeline stages deletable by owner" ON public.crm_pipeline_stages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND p.gm_user_id = auth.uid())
);
CREATE POLICY "Admins manage pipeline stages" ON public.crm_pipeline_stages FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Game tables
CREATE POLICY "Public can view published tables" ON public.game_tables FOR SELECT TO public USING (status = 'published' OR status = 'full');
CREATE POLICY "GMs can view own tables" ON public.game_tables FOR SELECT USING (auth.uid() = gm_user_id);
CREATE POLICY "GMs can insert own tables" ON public.game_tables FOR INSERT WITH CHECK (auth.uid() = gm_user_id);
CREATE POLICY "GMs can update own tables" ON public.game_tables FOR UPDATE USING (auth.uid() = gm_user_id OR public.is_admin(auth.uid()));
CREATE POLICY "GMs can delete own tables" ON public.game_tables FOR DELETE USING (auth.uid() = gm_user_id OR public.is_admin(auth.uid()));

-- Table sessions
CREATE POLICY "Public can view sessions of published tables" ON public.table_sessions FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND (gt.status = 'published' OR gt.status = 'full'))
);
CREATE POLICY "GMs can manage own table sessions" ON public.table_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_tables gt WHERE gt.id = game_table_id AND gt.gm_user_id = auth.uid())
);

-- Bookings
CREATE POLICY "Players can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = player_user_id);
CREATE POLICY "GMs can view bookings for own tables" ON public.bookings FOR SELECT USING (auth.uid() = gm_user_id);
CREATE POLICY "Players can insert bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = player_user_id);
CREATE POLICY "Players can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = player_user_id);
CREATE POLICY "GMs can update bookings for own tables" ON public.bookings FOR UPDATE USING (auth.uid() = gm_user_id);
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Reviews
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_user_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Posts
CREATE POLICY "Public can view published posts" ON public.posts FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Users can view own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage posts" ON public.posts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Campaigns
CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Campaign assets
CREATE POLICY "Campaign assets viewable by campaign owner" ON public.campaign_assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_user_id = auth.uid())
);
CREATE POLICY "Campaign assets insertable by owner" ON public.campaign_assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.owner_user_id = auth.uid())
);
CREATE POLICY "Admins manage campaign assets" ON public.campaign_assets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Admin actions
CREATE POLICY "Only admins can view admin actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Only admins can insert admin actions" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- System settings
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR SELECT TO public USING (true);
CREATE POLICY "Only admins can manage system settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- 16) INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_plans_code ON public.plans(code);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_founder_rank ON public.founder_benefits(founder_rank);
CREATE INDEX IF NOT EXISTS idx_founder_active ON public.founder_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_boost_user ON public.boost_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_status ON public.boost_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_game_tables_gm ON public.game_tables(gm_user_id);
CREATE INDEX IF NOT EXISTS idx_game_tables_status ON public.game_tables(status);
CREATE INDEX IF NOT EXISTS idx_game_tables_start ON public.game_tables(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_player ON public.bookings(player_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gm ON public.bookings(gm_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_gm ON public.crm_contacts(gm_user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_user ON public.profile_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_user_id);

-- =============================================
-- 17) TRIGGERS for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'player_profiles', 'gm_profiles', 'store_profiles', 'brand_profiles',
    'onboarding_sessions', 'profile_badges', 'subscription_events',
    'billing_profiles', 'wallets', 'wallet_transactions', 'credit_packages',
    'founder_benefits', 'crm_contacts', 'crm_interactions', 'crm_pipelines',
    'crm_pipeline_stages', 'game_tables', 'table_sessions', 'bookings',
    'reviews', 'posts', 'campaigns', 'campaign_assets', 'notifications',
    'admin_actions', 'system_settings'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
