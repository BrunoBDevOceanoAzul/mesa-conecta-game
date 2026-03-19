
-- Post-session feedback: GM evaluates players, players evaluate GM
CREATE TABLE public.session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  table_session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  reviewer_user_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('player_reviews_gm', 'gm_reviews_player')),
  -- Rating fields
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  engagement_rating INTEGER CHECK (engagement_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  creativity_rating INTEGER CHECK (creativity_rating BETWEEN 1 AND 5),
  -- Open text
  highlights TEXT,
  improvement_suggestions TEXT,
  would_play_again BOOLEAN,
  -- NPC feedback (player→GM only)
  favorite_npc TEXT,
  npc_impressions TEXT,
  -- GM notes on player
  player_behavior_notes TEXT,
  player_preparedness INTEGER CHECK (player_preparedness BETWEEN 1 AND 5),
  -- Metadata
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_table_id, table_session_id, reviewer_user_id, reviewed_user_id)
);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can create own feedback"
  ON public.session_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id);

-- Users can read feedback they wrote or received
CREATE POLICY "Users can read own feedback"
  ON public.session_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewer_user_id OR auth.uid() = reviewed_user_id);

-- Admins can read all
CREATE POLICY "Admins can read all feedback"
  ON public.session_feedback
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- NPC registry per session
CREATE TABLE public.session_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  table_session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  gm_user_id UUID NOT NULL,
  npc_name TEXT NOT NULL,
  npc_concept TEXT,
  npc_role TEXT,
  gm_notes TEXT,
  -- Aggregated player impressions
  player_impressions_json JSONB DEFAULT '[]'::jsonb,
  popularity_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GMs can manage their NPCs"
  ON public.session_npcs
  FOR ALL
  TO authenticated
  USING (auth.uid() = gm_user_id)
  WITH CHECK (auth.uid() = gm_user_id);

CREATE POLICY "Players can read NPCs from their tables"
  ON public.session_npcs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.game_table_id = session_npcs.game_table_id 
    AND b.player_user_id = auth.uid()
    AND b.status = 'confirmed'
  ));

CREATE POLICY "Admins can read all NPCs"
  ON public.session_npcs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Feedback email queue tracking
CREATE TABLE public.feedback_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  table_session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  recipient_user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('npc_form', 'gm_review', 'player_review')),
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'expired')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback emails"
  ON public.feedback_email_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Admins can manage feedback emails"
  ON public.feedback_email_queue
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "GMs can create feedback emails for their tables"
  ON public.feedback_email_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.game_tables gt 
    WHERE gt.id = feedback_email_queue.game_table_id 
    AND gt.gm_user_id = auth.uid()
  ));
