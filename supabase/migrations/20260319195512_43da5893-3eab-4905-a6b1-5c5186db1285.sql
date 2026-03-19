
-- Player Guilda: add all Aventureiro features (matchmaking, history, profile_score)
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"matchmaking": true, "history": true, "profile_score": true}'::jsonb
WHERE code LIKE 'player_guild%';

-- Player Free: add basic profile
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"profile_score": true}'::jsonb
WHERE code = 'player_free';

-- GM Pro: add agenda (already has schedule_management), ensure booking management
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"reservations": true}'::jsonb
WHERE code LIKE 'gm_pro%' AND code NOT LIKE 'gm_pro_plus%';

-- GM Pro+: add everything from Pro + extras
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"reservations": true, "priority_support": true}'::jsonb
WHERE code LIKE 'gm_pro_plus%';

-- Store Base: add schedule_management
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"schedule_management": true}'::jsonb
WHERE code LIKE 'store_base%';

-- Store Growth: add schedule, priority_support
UPDATE plans SET feature_flags = feature_flags::jsonb
  || '{"schedule_management": true, "dedicated_support": true}'::jsonb
WHERE code LIKE 'store_growth%';
