-- Migration: Create hives and hive_members tables
-- Created: 2026-04-26

CREATE TABLE IF NOT EXISTS hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hive_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hive_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hives_owner ON hives(owner_id);
CREATE INDEX IF NOT EXISTS idx_hive_members_hive ON hive_members(hive_id);
CREATE INDEX IF NOT EXISTS idx_hive_members_user ON hive_members(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_hives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hives_updated_at ON hives;
CREATE TRIGGER trigger_hives_updated_at
  BEFORE UPDATE ON hives
  FOR EACH ROW
  EXECUTE FUNCTION update_hives_updated_at();
