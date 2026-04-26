-- Migration: Add ghost_mode and privacy_settings to profiles
-- Created: 2026-04-26
-- Author: Mesa Conecta Team

-- Add ghost_mode column
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS ghost_mode BOOLEAN DEFAULT FALSE;

-- Add privacy_settings JSONB column with defaults
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
    "network": true,
    "hives": true,
    "market": true,
    "academy": true,
    "playground": true,
    "radar": true
  }'::jsonb;

-- Create index for ghost_mode queries
CREATE INDEX IF NOT EXISTS idx_profiles_ghost_mode ON profiles(ghost_mode) 
  WHERE ghost_mode = TRUE;

-- Update existing profiles with default privacy settings
UPDATE profiles 
SET privacy_settings = '{
  "network": true,
  "hives": true,
  "market": true,
  "academy": true,
  "playground": true,
  "radar": true
}'::jsonb
WHERE privacy_settings IS NULL;

COMMENT ON COLUMN profiles.ghost_mode IS 'Modo anônimo do Hive - oculta identidade do usuário';
COMMENT ON COLUMN profiles.privacy_settings IS 'Configurações de privacidade por frequência do Hive';
