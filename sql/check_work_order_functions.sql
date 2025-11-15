-- Kiểm tra các RPC functions có liên quan đến work_order
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%work_order%'
ORDER BY routine_name;

-- Kiểm tra parameters của work_order_create_atomic
SELECT 
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE '%work_order_create_atomic%'
ORDER BY ordinal_position;
