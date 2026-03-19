-- Add stripe_checkout_session_id to bookings for reconciliation
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- Add pending_payment to booking_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending_payment' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
  ) THEN
    ALTER TYPE public.booking_status ADD VALUE 'pending_payment';
  END IF;
END$$;
