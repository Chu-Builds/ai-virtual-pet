-- RUN THIS IN SUPABASE SQL EDITOR
-- Migration 003: active_pet_id on profiles + pet slot limit helper

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_pet_id uuid
  REFERENCES pets(id) ON DELETE SET NULL;

-- Returns how many pet slots a user has based on total interactions
CREATE OR REPLACE FUNCTION get_pet_slot_limit(total_interactions int)
RETURNS int
LANGUAGE plpgsql
AS $$
BEGIN
  IF total_interactions >= 60 THEN RETURN 3;
  ELSIF total_interactions >= 30 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;
