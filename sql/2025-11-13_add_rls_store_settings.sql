-- Add RLS policies for store_settings table
-- This allows authenticated users to read and update store settings

-- Enable RLS on store_settings (if not already enabled)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read store_settings" ON store_settings;
DROP POLICY IF EXISTS "Allow authenticated update store_settings" ON store_settings;

-- Allow all authenticated users to READ store_settings
CREATE POLICY "Allow authenticated read store_settings"
ON store_settings FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to UPDATE store_settings
CREATE POLICY "Allow authenticated update store_settings"
ON store_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'store_settings'
ORDER BY policyname;
