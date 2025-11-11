-- Check actual column names in parts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'parts'
ORDER BY ordinal_position;

-- Check actual column names in inventory_transactions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'inventory_transactions'
ORDER BY ordinal_position;
