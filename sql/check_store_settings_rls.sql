-- Check RLS policies on store_settings table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'store_settings';

-- Check if RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'store_settings';

-- Test manual UPDATE (replace 'your-actual-id' with the real id from first query)
-- SELECT id FROM store_settings LIMIT 1;
-- UPDATE store_settings SET store_name = 'Test Update' WHERE id = 'your-actual-id';
