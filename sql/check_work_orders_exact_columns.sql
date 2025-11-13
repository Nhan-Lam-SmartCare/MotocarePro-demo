-- Check exact column names in work_orders table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'work_orders'
ORDER BY ordinal_position;
