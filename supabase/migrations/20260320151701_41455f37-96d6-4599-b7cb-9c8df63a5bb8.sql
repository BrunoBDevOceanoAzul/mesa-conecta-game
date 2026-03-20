
CREATE TABLE public.blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL DEFAULT 'user',
  target_user_id UUID NULL,
  target_email TEXT NULL,
  blocked_by_user_id UUID NULL,
  reason TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocklist"
  ON public.blocklist
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "GMs and stores can manage own chat blocks"
  ON public.blocklist
  FOR ALL
  TO authenticated
  USING (
    block_type = 'chat'
    AND blocked_by_user_id = auth.uid()
  )
  WITH CHECK (
    block_type = 'chat'
    AND blocked_by_user_id = auth.uid()
  );
