
-- Clear existing plans and insert the official pricing table
DELETE FROM plans;

INSERT INTO plans (code, role, name, description, price_monthly, price_amount, billing_cycle, sort_order, is_active, is_public, trial_days, feature_flags) VALUES
-- Jogador
('player_free', 'player', 'Free', 'Acesso básico à plataforma', 0, 0, 'monthly', 1, true, true, 0, '{"reservation_limit": 1}'::jsonb),
('player_adventurer', 'player', 'Aventureiro', '3 reservas/mês e matchmaking inteligente', 1990, 1990, 'monthly', 2, true, true, 0, '{"reservation_limit": 3, "matchmaking": true, "history": true, "profile_score": true}'::jsonb),
('player_guild', 'player', 'Guilda', 'Reservas ilimitadas, prioridade, eventos exclusivos e cashback', 3990, 3990, 'monthly', 3, true, true, 0, '{"reservation_limit": -1, "matchmaking": true, "history": true, "profile_score": true, "priority_booking": true, "exclusive_badge": true, "early_access": true, "cashback": true}'::jsonb),

-- Mestre
('gm_pro', 'gm', 'Pro', 'Perfil profissional, agenda, CRM básico · Take rate 5% por mesa', 1990, 1990, 'monthly', 4, true, true, 14, '{"professional_profile": true, "schedule_management": true, "crm": true, "ai_text_assist": "basic", "ai_cover_generation": 3, "max_active_mesas": 5, "analytics_basic": true}'::jsonb),
('gm_pro_plus', 'gm', 'Pro+', 'Mesas ilimitadas, destaque, CRM avançado, analytics · Take rate 5% por mesa', 4990, 4990, 'monthly', 5, true, true, 14, '{"professional_profile": true, "schedule_management": true, "crm": true, "crm_advanced": true, "ai_text_assist": "full", "ai_cover_generation": -1, "ai_seo_optimization": true, "ai_performance_insights": true, "max_active_mesas": -1, "analytics_full": true, "boost_access": true}'::jsonb),

-- Luderia
('store_base', 'store', 'Base', 'Perfil, agenda pública, gestão de reservas · Take rate ~5% por reserva', 4990, 4990, 'monthly', 6, true, true, 14, '{"store_profile": true, "public_agenda": true, "reservations": true, "schedule_management": true, "mesas_per_month": 4, "analytics_basic": true}'::jsonb),
('store_growth', 'store', 'Growth', 'Destaque, analytics avançado, maior visibilidade · Take rate ~3% por reserva', 9990, 9990, 'monthly', 7, true, true, 14, '{"store_profile": true, "public_agenda": true, "reservations": true, "schedule_management": true, "mesas_per_month": 12, "analytics_full": true, "boost_access": true, "feed_highlight": true, "dedicated_support": true}'::jsonb);
