-- Kiểm tra RLS policies cho inventory_transactions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'inventory_transactions'
ORDER BY policyname;
