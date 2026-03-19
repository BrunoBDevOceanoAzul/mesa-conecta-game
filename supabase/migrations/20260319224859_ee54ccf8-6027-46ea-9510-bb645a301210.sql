
-- Quick replies presets for chat
CREATE TABLE public.chat_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'general',
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  role_target TEXT NOT NULL DEFAULT 'all',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active quick replies"
  ON public.chat_quick_replies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage quick replies"
  ON public.chat_quick_replies FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Anonymized chat analytics
CREATE TABLE public.chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  game_table_id UUID REFERENCES public.game_tables(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can insert analytics"
  ON public.chat_analytics FOR INSERT
  TO authenticated
  WITH CHECK (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Admins can read analytics"
  ON public.chat_analytics FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_chat_analytics_table ON public.chat_analytics(game_table_id);
CREATE INDEX idx_chat_analytics_event ON public.chat_analytics(event_type);

-- Seed default quick replies
INSERT INTO public.chat_quick_replies (category, label, content, role_target, sort_order) VALUES
  ('greeting', '👋 Olá!', 'Olá! Tudo bem? Estou animado(a) para a sessão!', 'player', 1),
  ('greeting', '🎲 Bem-vindo!', 'Bem-vindo(a) à mesa! Qualquer dúvida, é só perguntar.', 'gm', 2),
  ('session', '⏰ Horário', 'A que horas vamos começar exatamente?', 'player', 3),
  ('session', '📋 Preparação', 'Preciso preparar algo antes da sessão?', 'player', 4),
  ('session', '✅ Confirmação', 'Confirmado(a) para a sessão!', 'all', 5),
  ('session', '❌ Ausência', 'Infelizmente não vou conseguir participar dessa sessão.', 'player', 6),
  ('gm_tools', '📖 Resumo', 'Pessoal, vou postar o resumo da última sessão em breve!', 'gm', 7),
  ('gm_tools', '🎭 NPCs', 'Vocês vão encontrar alguns NPCs interessantes hoje...', 'gm', 8),
  ('gm_tools', '⚔️ Combate', 'Preparem suas fichas, hoje teremos combate!', 'gm', 9),
  ('feedback', '🌟 Incrível!', 'Sessão incrível! Muito obrigado(a)!', 'player', 10),
  ('feedback', '💡 Sugestão', 'Tenho uma sugestão para a próxima sessão...', 'all', 11),
  ('feedback', '🤔 Dúvida', 'Tenho uma dúvida sobre as regras...', 'player', 12);

-- Enable realtime for messages (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_analytics;
