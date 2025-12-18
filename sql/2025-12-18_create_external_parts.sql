-- Create external_parts table for scraped data
CREATE TABLE IF NOT EXISTS external_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC DEFAULT 0,
  category TEXT,
  image_url TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE external_parts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (since it's a utility table)
CREATE POLICY "Enable all access for authenticated users" ON external_parts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create index on name for faster search
CREATE INDEX IF NOT EXISTS idx_external_parts_name ON external_parts(name);
