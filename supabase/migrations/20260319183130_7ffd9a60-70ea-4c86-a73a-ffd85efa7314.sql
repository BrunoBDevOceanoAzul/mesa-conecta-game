
-- Availability rules for recurring weekly schedules
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'gm',
  rule_type text NOT NULL DEFAULT 'weekly_recurring',
  day_of_week smallint,
  start_time time NOT NULL,
  end_time time NOT NULL,
  start_date date,
  end_date date,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active boolean NOT NULL DEFAULT true,
  availability_type text NOT NULL DEFAULT 'available',
  accepted_formats_json jsonb DEFAULT '[]'::jsonb,
  accepted_modalities_json jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Availability exceptions for specific dates
CREATE TABLE public.availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'gm',
  exception_date date NOT NULL,
  exception_type text NOT NULL DEFAULT 'blocked',
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_availability_rules_user ON public.availability_rules(user_id);
CREATE INDEX idx_availability_rules_day ON public.availability_rules(day_of_week) WHERE is_active = true;
CREATE INDEX idx_availability_exceptions_user ON public.availability_exceptions(user_id);
CREATE INDEX idx_availability_exceptions_date ON public.availability_exceptions(exception_date);

-- RLS
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Rules policies
CREATE POLICY "Users can view own rules" ON public.availability_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.availability_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.availability_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.availability_rules FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage rules" ON public.availability_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Exceptions policies
CREATE POLICY "Users can view own exceptions" ON public.availability_exceptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exceptions" ON public.availability_exceptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exceptions" ON public.availability_exceptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exceptions" ON public.availability_exceptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage exceptions" ON public.availability_exceptions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_availability_rules_updated_at BEFORE UPDATE ON public.availability_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_availability_exceptions_updated_at BEFORE UPDATE ON public.availability_exceptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
