-- Kiểm tra chi tiết tại sao trigger không hoạt động
-- Run in Supabase SQL Editor

-- 1. Check current RLS status on parts table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'parts';

-- 2. Check RLS policies on parts table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'parts';

-- 3. Test adjust_part_stock function directly
DO $$
DECLARE
  test_part_id TEXT;
  stock_before INT;
  stock_after INT;
BEGIN
  -- Get a test part
  SELECT id INTO test_part_id FROM parts LIMIT 1;
  
  IF test_part_id IS NULL THEN
    RAISE NOTICE 'No parts found';
    RETURN;
  END IF;
  
  RAISE NOTICE '=== TESTING adjust_part_stock DIRECTLY ===';
  RAISE NOTICE 'Test part: %', test_part_id;
  
  -- Get stock before
  SELECT COALESCE((stock->>'CN1')::int, 0) INTO stock_before
  FROM parts WHERE id = test_part_id;
  RAISE NOTICE 'Stock before: %', stock_before;
  
  -- Call function directly
  BEGIN
    PERFORM adjust_part_stock(test_part_id, 'CN1', 10::NUMERIC);
    RAISE NOTICE 'Function call succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Function call FAILED: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  -- Get stock after
  SELECT COALESCE((stock->>'CN1')::int, 0) INTO stock_after
  FROM parts WHERE id = test_part_id;
  RAISE NOTICE 'Stock after: %', stock_after;
  
  IF stock_after = stock_before + 10 THEN
    RAISE NOTICE '✅ Function works! Reverting...';
    PERFORM adjust_part_stock(test_part_id, 'CN1', -10::NUMERIC);
  ELSE
    RAISE NOTICE '❌ Function did not update stock';
  END IF;
END $$;

-- 4. Check function definition
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'adjust_part_stock';
