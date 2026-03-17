-- Add trial_days column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0;
-- Add founder tracking columns
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_founder_plan boolean DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS founder_slots_total integer DEFAULT 0;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS founder_slots_used integer DEFAULT 0;
-- Update existing founder plans
UPDATE public.plans SET is_founder_plan = true, founder_slots_total = 100, founder_slots_used = 0 WHERE code LIKE '%_founder';
-- Add trial days for GM and Store plans
UPDATE public.plans SET trial_days = 14 WHERE role IN ('gm', 'store');