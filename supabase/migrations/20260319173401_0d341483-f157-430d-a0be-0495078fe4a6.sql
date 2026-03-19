
-- ═══════════════════════════════════════════════
-- HIVIUM Chat / Messaging System
-- ═══════════════════════════════════════════════

-- 1. Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text NOT NULL DEFAULT 'gm_player',
  subject text,
  related_table_id uuid REFERENCES public.game_tables(id) ON DELETE SET NULL,
  related_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  related_store_id uuid,
  created_by_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Conversation participants
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_label text DEFAULT 'member',
  last_read_at timestamptz DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  content text NOT NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  is_edited boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by_user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_user_id);

-- 5. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Helper: check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  );
$$;

-- 7. RLS Policies — conversations
CREATE POLICY "Users see own conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(auth.uid(), id));

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (is_conversation_participant(auth.uid(), id));

CREATE POLICY "Admins manage conversations"
  ON public.conversations FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 8. RLS Policies — conversation_participants
CREATE POLICY "Participants see own membership"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Creator can add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND created_by_user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can update own participation"
  ON public.conversation_participants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage participants"
  ON public.conversation_participants FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 9. RLS Policies — messages
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND is_conversation_participant(auth.uid(), conversation_id)
  );

CREATE POLICY "Senders can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_user_id);

CREATE POLICY "Admins manage messages"
  ON public.messages FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 10. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- 11. Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_participants_updated_at
  BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
