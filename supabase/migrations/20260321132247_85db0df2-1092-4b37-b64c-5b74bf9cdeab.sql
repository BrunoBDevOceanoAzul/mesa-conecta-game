
-- =====================================================
-- FASE 1: Tabelas Asaas White Label
-- =====================================================

-- 1. asaas_accounts — Subcontas gerenciadas (GMs, Lojas, Marcas)
CREATE TABLE public.asaas_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asaas_id text UNIQUE,                          -- "sub_xxx" retornado pelo Asaas
  wallet_id text,                                 -- wallet ID da subconta
  account_type text NOT NULL DEFAULT 'managed',   -- managed | standard
  person_type text NOT NULL DEFAULT 'FISICA',     -- FISICA | JURIDICA
  company_type text,                              -- MEI, LIMITED, etc.
  name text NOT NULL,
  email text,
  cpf_cnpj text,
  phone text,
  mobile_phone text,
  address_json jsonb DEFAULT '{}'::jsonb,
  onboarding_status text NOT NULL DEFAULT 'pending', -- pending | submitted | verified | rejected
  commercial_info_status text DEFAULT 'pending',
  bank_account_status text DEFAULT 'pending',
  documents_status text DEFAULT 'pending',
  general_status text DEFAULT 'pending',
  income_value numeric(12,2) DEFAULT 0,
  api_key text,                                   -- subconta API key (quando aplicável)
  capabilities_json jsonb DEFAULT '{}'::jsonb,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_asaas_accounts_user ON public.asaas_accounts(user_id);
CREATE INDEX idx_asaas_accounts_asaas_id ON public.asaas_accounts(asaas_id);

ALTER TABLE public.asaas_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas account"
  ON public.asaas_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access asaas_accounts"
  ON public.asaas_accounts FOR ALL
  USING (public.is_admin(auth.uid()));

-- 2. asaas_customers — Jogadores como clientes Asaas
CREATE TABLE public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asaas_id text UNIQUE,                           -- "cus_xxx" retornado pelo Asaas
  name text NOT NULL,
  email text,
  cpf_cnpj text,
  phone text,
  mobile_phone text,
  address_json jsonb DEFAULT '{}'::jsonb,
  notifications_disabled boolean DEFAULT false,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_asaas_customers_user ON public.asaas_customers(user_id);
CREATE INDEX idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_id);

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customer"
  ON public.asaas_customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access asaas_customers"
  ON public.asaas_customers FOR ALL
  USING (public.is_admin(auth.uid()));

-- 3. billing_products — Catálogo local de planos/produtos
CREATE TABLE public.billing_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  product_type text NOT NULL DEFAULT 'subscription', -- subscription | one_time | booking
  target_role text,                                  -- player | gm | store | brand | null (all)
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  billing_cycle text DEFAULT 'MONTHLY',              -- MONTHLY | YEARLY | WEEKLY | null
  feature_flags jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  stripe_price_id text,                              -- legado, manter para referência
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_products_code ON public.billing_products(code);
CREATE INDEX idx_billing_products_type_role ON public.billing_products(product_type, target_role);

ALTER TABLE public.billing_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active billing products"
  ON public.billing_products FOR SELECT
  USING (is_active = true AND is_public = true);

CREATE POLICY "Admin full access billing_products"
  ON public.billing_products FOR ALL
  USING (public.is_admin(auth.uid()));

-- 4. asaas_payments — Pagamentos via Asaas
CREATE TABLE public.asaas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asaas_id text UNIQUE,                            -- "pay_xxx"
  asaas_subscription_id text,                      -- referência à subscription no Asaas
  billing_product_id uuid REFERENCES public.billing_products(id),
  booking_id uuid,
  mesa_id uuid,
  billing_type text NOT NULL DEFAULT 'PIX',        -- PIX | CREDIT_CARD | BOLETO
  amount_cents integer NOT NULL,
  net_amount_cents integer,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'PENDING',          -- PENDING | CONFIRMED | RECEIVED | OVERDUE | REFUNDED | etc.
  due_date date,
  payment_date date,
  invoice_url text,
  bank_slip_url text,
  pix_qr_code text,
  pix_copy_paste text,
  refund_reason text,
  split_json jsonb DEFAULT '[]'::jsonb,            -- split rules applied
  description text,
  external_reference text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_payments_user ON public.asaas_payments(user_id);
CREATE INDEX idx_asaas_payments_asaas_id ON public.asaas_payments(asaas_id);
CREATE INDEX idx_asaas_payments_status ON public.asaas_payments(status);
CREATE INDEX idx_asaas_payments_booking ON public.asaas_payments(booking_id);

ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas payments"
  ON public.asaas_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access asaas_payments"
  ON public.asaas_payments FOR ALL
  USING (public.is_admin(auth.uid()));

-- 5. asaas_subscriptions — Assinaturas via Asaas
CREATE TABLE public.asaas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asaas_id text UNIQUE,                            -- "sub_xxx" da subscription
  billing_product_id uuid REFERENCES public.billing_products(id),
  billing_type text NOT NULL DEFAULT 'CREDIT_CARD',
  cycle text NOT NULL DEFAULT 'MONTHLY',
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'ACTIVE',           -- ACTIVE | INACTIVE | EXPIRED
  next_due_date date,
  description text,
  external_reference text,
  split_json jsonb DEFAULT '[]'::jsonb,
  discount_json jsonb,
  fine_json jsonb,
  interest_json jsonb,
  end_date date,
  max_payments integer,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_subscriptions_user ON public.asaas_subscriptions(user_id);
CREATE INDEX idx_asaas_subscriptions_asaas_id ON public.asaas_subscriptions(asaas_id);
CREATE INDEX idx_asaas_subscriptions_status ON public.asaas_subscriptions(status);

ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas subscriptions"
  ON public.asaas_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access asaas_subscriptions"
  ON public.asaas_subscriptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- 6. asaas_webhook_events — Log de idempotência para webhooks
CREATE TABLE public.asaas_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received',         -- received | processed | failed
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_asaas_webhook_event_id ON public.asaas_webhook_events(event_id);
CREATE INDEX idx_asaas_webhook_events_type ON public.asaas_webhook_events(event_type);

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only asaas_webhook_events"
  ON public.asaas_webhook_events FOR ALL
  USING (public.is_admin(auth.uid()));

-- 7. Triggers de updated_at
CREATE TRIGGER update_asaas_accounts_updated_at
  BEFORE UPDATE ON public.asaas_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asaas_customers_updated_at
  BEFORE UPDATE ON public.asaas_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_products_updated_at
  BEFORE UPDATE ON public.billing_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asaas_payments_updated_at
  BEFORE UPDATE ON public.asaas_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asaas_subscriptions_updated_at
  BEFORE UPDATE ON public.asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
