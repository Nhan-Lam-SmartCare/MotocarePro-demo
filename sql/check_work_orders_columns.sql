-- Check work_orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'work_orders'
ORDER BY ordinal_position;
