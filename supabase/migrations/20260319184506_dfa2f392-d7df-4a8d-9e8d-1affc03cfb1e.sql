
-- Add pricing feedback columns to interest_leads
ALTER TABLE public.interest_leads
  ADD COLUMN IF NOT EXISTS pricing_feedback_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS perceived_value_score smallint,
  ADD COLUMN IF NOT EXISTS price_fairness_label text,
  ADD COLUMN IF NOT EXISTS preferred_billing_cycle text,
  ADD COLUMN IF NOT EXISTS plan_objections_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS value_drivers_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS wants_trial boolean DEFAULT false;

-- Create detailed pricing feedback table
CREATE TABLE public.interest_pricing_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.interest_leads(id) ON DELETE CASCADE NOT NULL,
  role_context text NOT NULL,
  plan_presented text NOT NULL,
  perceived_price_position text,
  willingness_to_pay_range text,
  preferred_billing_cycle text,
  main_value_drivers jsonb DEFAULT '[]'::jsonb,
  main_objections jsonb DEFAULT '[]'::jsonb,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interest_pricing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert pricing feedback" ON public.interest_pricing_feedback
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view pricing feedback" ON public.interest_pricing_feedback
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
