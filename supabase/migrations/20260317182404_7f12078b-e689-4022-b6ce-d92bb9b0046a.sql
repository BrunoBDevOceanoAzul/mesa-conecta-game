
-- Badge definitions (catalog of all badges)
CREATE TABLE public.badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  flavor_text text,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('founder','consistency','growth','community','quality','general')),
  icon_key text,
  visual_theme jsonb DEFAULT '{}'::jsonb,
  xp_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badge definitions are publicly readable" ON public.badge_definitions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage badge definitions" ON public.badge_definitions FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Master XP profiles
CREATE TABLE public.master_xp_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  current_title text NOT NULL DEFAULT 'Iniciante',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_xp_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp profile" ON public.master_xp_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp profile" ON public.master_xp_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp profile" ON public.master_xp_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all xp profiles" ON public.master_xp_profiles FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Anyone can view xp profiles" ON public.master_xp_profiles FOR SELECT USING (true);

-- Master badges (awarded to users)
CREATE TABLE public.master_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_definition_id uuid NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  awarded_reason text,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  source_type text DEFAULT 'system',
  is_founder_badge boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, badge_definition_id)
);
ALTER TABLE public.master_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.master_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view badges" ON public.master_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.master_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all badges" ON public.master_badges FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- XP events log
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  xp_amount integer NOT NULL,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp events" ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp events" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all xp events" ON public.xp_events FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_badge_definitions_updated_at BEFORE UPDATE ON public.badge_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_master_xp_profiles_updated_at BEFORE UPDATE ON public.master_xp_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed founder badge definitions
INSERT INTO public.badge_definitions (code, name, slug, description, flavor_text, rarity, category, icon_key, xp_reward) VALUES
  ('founder_i', 'Founder I', 'founder-i', 'Primeiro entre os primeiros. Você ajudou a construir a HIVIUM desde o início.', 'Toda lenda começa com o primeiro passo.', 'legendary', 'founder', 'crown', 100),
  ('founder_circle', 'Founder Circle', 'founder-circle', 'Membro do círculo exclusivo dos 10 primeiros mestres da HIVIUM.', 'O círculo se fecha. Você está dentro.', 'legendary', 'founder', 'users', 100),
  ('early_architect', 'Early Architect', 'early-architect', 'Arquiteto das primeiras mesas que deram forma à plataforma.', 'Cada mesa é uma peça no mapa do mundo.', 'epic', 'founder', 'building', 80),
  ('mesa_pioneira', 'Mesa Pioneira', 'mesa-pioneira', 'Publicou uma das primeiras mesas da plataforma HIVIUM.', 'Aventuras começam com uma mesa vazia e um convite.', 'epic', 'founder', 'map', 80);

-- Seed progression badge definitions
INSERT INTO public.badge_definitions (code, name, slug, description, flavor_text, rarity, category, icon_key, xp_reward) VALUES
  ('first_mesa', 'Primeira Mesa', 'primeira-mesa', 'Publicou sua primeira mesa na HIVIUM.', 'A jornada de mil milhas começa com o primeiro passo.', 'common', 'growth', 'plus-circle', 0),
  ('three_mesas', 'Trilogia', 'trilogia', 'Publicou 3 mesas na plataforma.', 'Três é o número mágico.', 'rare', 'growth', 'layers', 0),
  ('first_booking', 'Primeira Reserva', 'primeira-reserva', 'Recebeu a primeira reserva de um jogador.', 'Alguém acreditou na sua mesa.', 'common', 'community', 'user-check', 0),
  ('full_house', 'Mesa Lotada', 'mesa-lotada', 'Lotou uma mesa inteira com jogadores.', 'Casa cheia, energia máxima.', 'rare', 'quality', 'users', 0),
  ('consistency_30', 'Consistência 30', 'consistencia-30', '30 dias operando ativamente na HIVIUM.', 'A constância é a mãe da maestria.', 'rare', 'consistency', 'calendar-check', 0),
  ('consistency_90', 'Veterano Operacional', 'veterano-operacional', '90 dias de operação contínua.', 'Três luas. Você é parte da paisagem.', 'epic', 'consistency', 'shield', 0),
  ('pro_activated', 'Pro Ativado', 'pro-ativado', 'Ativou um plano profissional na HIVIUM.', 'Investir em si é a melhor aposta.', 'rare', 'growth', 'zap', 0),
  ('community_voice', 'Voz da Comunidade', 'voz-da-comunidade', 'Publicou conteúdo no feed da HIVIUM.', 'Sua voz ressoa na comunidade.', 'common', 'community', 'message-square', 0);
