
ALTER TABLE public.billing_profiles 
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS mobile_phone text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS is_financial_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS financial_completion_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz;

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.billing_profiles ADD CONSTRAINT billing_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
