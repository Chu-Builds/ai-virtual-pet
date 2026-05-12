CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coparent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  species text CHECK (species IN ('cat', 'dog', 'bunny')) NOT NULL,
  energy int DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  affection int DEFAULT 80 CHECK (affection >= 0 AND affection <= 100),
  hunger int DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  personality_summary text DEFAULT '',
  memory jsonb DEFAULT '[]'::jsonb,
  growth_stage int DEFAULT 1 CHECK (growth_stage >= 1 AND growth_stage <= 3),
  interaction_count int DEFAULT 0,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or coparent can read"
  ON pets FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = coparent_id);

CREATE POLICY "owner or coparent can update"
  ON pets FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = coparent_id);

CREATE POLICY "owner can insert"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner can delete"
  ON pets FOR DELETE
  USING (auth.uid() = owner_id);
