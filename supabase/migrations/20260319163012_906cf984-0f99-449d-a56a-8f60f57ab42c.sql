
CREATE TABLE public.interest_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  city text,
  state text,
  instagram text,
  selected_roles_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_role text,
  player_answers_json jsonb DEFAULT '{}'::jsonb,
  gm_answers_json jsonb DEFAULT '{}'::jsonb,
  store_answers_json jsonb DEFAULT '{}'::jsonb,
  common_answers_json jsonb DEFAULT '{}'::jsonb,
  interest_score integer DEFAULT 0,
  pricing_sensitivity text,
  willingness_to_pay text,
  early_adopter_interest text,
  wants_followup boolean DEFAULT false,
  high_intent_lead boolean DEFAULT false,
  likely_paid_user boolean DEFAULT false,
  likely_founder boolean DEFAULT false,
  cluster_label text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interest_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interest leads" ON public.interest_leads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Only admins can view interest leads" ON public.interest_leads
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can update interest leads" ON public.interest_leads
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE UNIQUE INDEX idx_interest_leads_email ON public.interest_leads (email);

CREATE TRIGGER update_interest_leads_updated_at
  BEFORE UPDATE ON public.interest_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
