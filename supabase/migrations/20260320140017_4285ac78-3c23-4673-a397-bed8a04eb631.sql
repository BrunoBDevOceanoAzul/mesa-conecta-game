
-- Store time slots for scheduling and occupancy control
CREATE TABLE public.store_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_tables INTEGER NOT NULL DEFAULT 1,
  max_seats INTEGER NOT NULL DEFAULT 8,
  tables_booked INTEGER NOT NULL DEFAULT 0,
  seats_booked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  recurrence_rule TEXT DEFAULT NULL,
  recurrence_group_id UUID DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link mesas to specific store slots
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS store_slot_id UUID REFERENCES public.store_time_slots(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_store_slots_store_date ON public.store_time_slots(store_id, slot_date);
CREATE INDEX idx_store_slots_owner ON public.store_time_slots(owner_user_id);
CREATE INDEX idx_mesas_store_slot ON public.mesas(store_slot_id);

-- RLS
ALTER TABLE public.store_time_slots ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their own slots
CREATE POLICY "Store owners manage own slots"
  ON public.store_time_slots
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Anyone can view available slots
CREATE POLICY "Anyone can view available slots"
  ON public.store_time_slots
  FOR SELECT
  TO authenticated
  USING (status = 'available');

-- Admins full access
CREATE POLICY "Admins manage all slots"
  ON public.store_time_slots
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_store_time_slots_updated_at
  BEFORE UPDATE ON public.store_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
