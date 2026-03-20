
-- Cart abandonment tracking table
CREATE TABLE public.cart_abandonments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_user_id UUID NOT NULL,
  player_email TEXT,
  player_name TEXT,
  mesa_id UUID NOT NULL,
  mesa_title TEXT,
  gm_user_id UUID NOT NULL,
  booking_id UUID,
  stripe_checkout_session_id TEXT,
  amount_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'brl',
  status TEXT NOT NULL DEFAULT 'abandoned',
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovered_at TIMESTAMPTZ,
  remarketing_sent_at TIMESTAMPTZ,
  remarketing_channel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cart_abandonments_gm ON public.cart_abandonments(gm_user_id, status);
CREATE INDEX idx_cart_abandonments_mesa ON public.cart_abandonments(mesa_id);
CREATE INDEX idx_cart_abandonments_player ON public.cart_abandonments(player_user_id);
CREATE INDEX idx_cart_abandonments_status ON public.cart_abandonments(status, abandoned_at DESC);

-- Enable RLS
ALTER TABLE public.cart_abandonments ENABLE ROW LEVEL SECURITY;

-- GMs can see abandonments for their mesas
CREATE POLICY "GMs can view their cart abandonments"
ON public.cart_abandonments FOR SELECT
TO authenticated
USING (
  gm_user_id = auth.uid()
  OR public.is_super_user(auth.uid())
);

-- Service role inserts (from edge functions)
CREATE POLICY "Service can insert cart abandonments"
ON public.cart_abandonments FOR INSERT
TO authenticated
WITH CHECK (true);

-- GMs can update their own (for remarketing tracking)
CREATE POLICY "GMs can update their cart abandonments"
ON public.cart_abandonments FOR UPDATE
TO authenticated
USING (
  gm_user_id = auth.uid()
  OR public.is_super_user(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_cart_abandonments_updated_at
BEFORE UPDATE ON public.cart_abandonments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_abandonments;
