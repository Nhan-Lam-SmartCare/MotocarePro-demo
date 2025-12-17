-- Xem CHI TIẾT parameters của work_order_create_atomic
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as full_parameters
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'work_order_create_atomic'
ORDER BY oid;
