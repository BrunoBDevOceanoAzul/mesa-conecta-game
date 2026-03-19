
-- GM Pro: AI text assist basic + limited cover generation + schedule
UPDATE plans SET feature_flags = jsonb_set(
  jsonb_set(
    jsonb_set(feature_flags::jsonb, '{ai_text_assist}', '"basic"'),
    '{ai_cover_generation}', '3'
  ),
  '{schedule_management}', 'true'
)
WHERE code LIKE 'gm_pro%' AND code NOT LIKE 'gm_pro_plus%';

-- GM Pro+: Full AI suite
UPDATE plans SET feature_flags = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(feature_flags::jsonb, '{ai_text_assist}', '"full"'),
        '{ai_cover_generation}', '-1'
      ),
      '{ai_seo_optimization}', 'true'
    ),
    '{ai_performance_insights}', 'true'
  ),
  '{schedule_management}', 'true'
)
WHERE code LIKE 'gm_pro_plus%';

-- Store Base: basic AI text + mesas_per_month
UPDATE plans SET feature_flags = jsonb_set(
  jsonb_set(feature_flags::jsonb, '{ai_text_assist}', '"basic"'),
  '{mesas_per_month}', '4'
)
WHERE code LIKE 'store_base%';

-- Store Growth: full AI suite + mesas_per_month
UPDATE plans SET feature_flags = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(feature_flags::jsonb, '{ai_text_assist}', '"full"'),
      '{ai_cover_generation}', '-1'
    ),
    '{ai_seo_optimization}', 'true'
  ),
  '{mesas_per_month}', '12'
)
WHERE code LIKE 'store_growth%';

-- Player Guilda: add cashback
UPDATE plans SET feature_flags = jsonb_set(feature_flags::jsonb, '{cashback}', 'true')
WHERE code LIKE 'player_guild%';

-- Player Aventureiro: add history + profile_score
UPDATE plans SET feature_flags = jsonb_set(
  jsonb_set(feature_flags::jsonb, '{history}', 'true'),
  '{profile_score}', 'true'
)
WHERE code LIKE 'player_adventurer%';

-- Player Free: add history
UPDATE plans SET feature_flags = jsonb_set(feature_flags::jsonb, '{history}', 'true')
WHERE code = 'player_free';
