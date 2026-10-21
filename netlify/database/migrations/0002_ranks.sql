ALTER TABLE members ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS name_key text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ranks text[] NOT NULL DEFAULT ARRAY['Member'];
CREATE UNIQUE INDEX IF NOT EXISTS members_name_key_idx ON members (name_key) WHERE name_key IS NOT NULL;
