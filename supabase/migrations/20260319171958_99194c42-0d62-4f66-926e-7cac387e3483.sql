
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_play boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_gm boolean NOT NULL DEFAULT false;
