
-- Waitlist for full mesas
CREATE TABLE public.mesa_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  status text NOT NULL DEFAULT 'waiting', -- waiting, notified, converted, canceled
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mesa_id, user_id)
);

ALTER TABLE public.mesa_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can see their own waitlist entries
CREATE POLICY "Users can view own waitlist" ON public.mesa_waitlist
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can join waitlist
CREATE POLICY "Users can join waitlist" ON public.mesa_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can cancel their own waitlist entry
CREATE POLICY "Users can cancel own waitlist" ON public.mesa_waitlist
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- GM/organizer can view waitlist for their mesas
CREATE POLICY "GM can view mesa waitlist" ON public.mesa_waitlist
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mesas WHERE id = mesa_id AND gm_id = auth.uid()
  ));

-- Admins full access
CREATE POLICY "Admin full access waitlist" ON public.mesa_waitlist
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
