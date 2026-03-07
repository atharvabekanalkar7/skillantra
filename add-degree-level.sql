ALTER TABLE profiles ADD COLUMN IF NOT EXISTS degree_level text CHECK (degree_level IN ('UG', 'PG'));
ALTER TABLE internships ADD COLUMN IF NOT EXISTS target_degree text DEFAULT 'both' CHECK (target_degree IN ('both', 'ug', 'pg'));
