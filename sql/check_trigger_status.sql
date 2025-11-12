-- Kiểm tra trigger và function có tồn tại không
-- Run this in Supabase SQL Editor

-- 1. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trg_inventory_tx_after_insert';

-- 2. Check if trigger function exists
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'inventory_tx_after_insert';

-- 3. Check if adjust_part_stock function exists
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'adjust_part_stock';

-- 4. Test trigger manually
DO $$
DECLARE
  test_part_id TEXT;
  test_branch_id TEXT := 'CN1';
  stock_before INT;
  stock_after INT;
BEGIN
  -- Get a test part
  SELECT id INTO test_part_id 
  FROM public.parts 
  WHERE stock ? test_branch_id
  LIMIT 1;
  
  IF test_part_id IS NULL THEN
    RAISE NOTICE 'No parts found for testing';
    RETURN;
  END IF;
  
  -- Get stock before
  SELECT COALESCE((stock->>test_branch_id)::int, 0) INTO stock_before
  FROM public.parts 
  WHERE id = test_part_id;
  
  RAISE NOTICE 'Testing with part: %', test_part_id;
  RAISE NOTICE 'Stock before: %', stock_before;
  
  -- Try calling adjust_part_stock directly
  BEGIN
    PERFORM public.adjust_part_stock(test_part_id, test_branch_id, 5);
    RAISE NOTICE 'Direct function call succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Direct function call failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  -- Get stock after
  SELECT COALESCE((stock->>test_branch_id)::int, 0) INTO stock_after
  FROM public.parts 
  WHERE id = test_part_id;
  
  RAISE NOTICE 'Stock after: %', stock_after;
  
  IF stock_after = stock_before + 5 THEN
    RAISE NOTICE '✅ adjust_part_stock works!';
    -- Revert
    PERFORM public.adjust_part_stock(test_part_id, test_branch_id, -5);
  ELSE
    RAISE NOTICE '❌ adjust_part_stock failed';
  END IF;
END $$;
