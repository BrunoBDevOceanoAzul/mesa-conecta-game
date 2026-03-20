
CREATE OR REPLACE FUNCTION public.increment_slot_occupancy(_slot_id uuid, _seats integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.store_time_slots
  SET
    tables_booked = tables_booked + 1,
    seats_booked = seats_booked + _seats,
    status = CASE
      WHEN tables_booked + 1 >= max_tables THEN 'full'
      ELSE 'available'
    END,
    updated_at = now()
  WHERE id = _slot_id;
END;
$$;
