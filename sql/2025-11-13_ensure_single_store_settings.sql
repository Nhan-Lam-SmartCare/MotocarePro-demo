-- Ensure only one row in store_settings table
-- This prevents data loss when reloading

-- Step 1: Check current rows
SELECT id, store_name, created_at 
FROM store_settings 
ORDER BY created_at DESC;

-- Step 2: If there are multiple rows, delete old ones (keep the newest)
-- Uncomment and run this if you see multiple rows above:
/*
DELETE FROM store_settings 
WHERE id NOT IN (
  SELECT id FROM store_settings 
  ORDER BY created_at DESC 
  LIMIT 1
);
*/

-- Step 3: Verify only one row remains
SELECT COUNT(*) as total_rows FROM store_settings;

-- Step 4: Add unique constraint to prevent multiple rows in future
-- ALTER TABLE store_settings ADD CONSTRAINT single_row_only CHECK (id = (SELECT id FROM store_settings LIMIT 1));
