CREATE TABLE IF NOT EXISTS stats (
  id int PRIMARY KEY,
  clicks bigint NOT NULL DEFAULT 0
);
INSERT INTO stats (id, clicks) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS members (
  visitor_id text PRIMARY KEY,
  ip_hash text,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS members_ip_hash_idx ON members (ip_hash);
