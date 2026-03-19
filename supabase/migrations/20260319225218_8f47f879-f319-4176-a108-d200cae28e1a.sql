
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_plan_role_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_role_check CHECK (plan_role = ANY (ARRAY['player'::text, 'gm'::text, 'store'::text, 'brand'::text, 'admin'::text]));
