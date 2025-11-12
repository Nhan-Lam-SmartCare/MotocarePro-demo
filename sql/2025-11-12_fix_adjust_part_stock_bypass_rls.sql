-- ============================================
-- FIX: Make adjust_part_stock bypass RLS completely
-- Function cần quyền superuser để bypass RLS
-- Date: 2025-11-12
-- ============================================

-- Recreate adjust_part_stock with explicit RLS bypass
CREATE OR REPLACE FUNCTION public.adjust_part_stock(
  p_part_id TEXT, 
  p_branch_id TEXT, 
  p_delta NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INT;
  v_delta_int INT;
BEGIN
  -- Convert delta to INT for stock calculation
  v_delta_int := p_delta::INT;
  
  -- IMPORTANT: Disable RLS for this transaction
  -- This allows the function to update regardless of RLS policies
  SET LOCAL row_security = off;
  
  -- Lock row to avoid concurrent modification
  SELECT COALESCE((stock->>p_branch_id)::int, 0) INTO v_current
  FROM public.parts
  WHERE id = p_part_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PART_NOT_FOUND: Part % does not exist', p_part_id;
  END IF;

  -- Update stock
  UPDATE public.parts
  SET stock = jsonb_set(
    stock, 
    ARRAY[p_branch_id], 
    to_jsonb(GREATEST(0, v_current + v_delta_int)), 
    true
  )
  WHERE id = p_part_id;
  
  -- Log for debugging
  RAISE NOTICE 'Stock adjusted: part=%, branch=%, old=%, delta=%, new=%', 
    p_part_id, p_branch_id, v_current, v_delta_int, GREATEST(0, v_current + v_delta_int);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.adjust_part_stock(TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_part_stock(TEXT, TEXT, NUMERIC) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.adjust_part_stock(TEXT, TEXT, NUMERIC) IS
  'Adjusts part stock for a specific branch. Uses SECURITY DEFINER and bypasses RLS to ensure stock updates work from triggers. Prevents negative stock.';

-- Test the function
DO $$
DECLARE
  test_part_id TEXT;
  stock_before INT;
  stock_after INT;
BEGIN
  RAISE NOTICE '=== TESTING adjust_part_stock WITH RLS BYPASS ===';
  
  -- Get a test part
  SELECT id INTO test_part_id FROM parts LIMIT 1;
  
  IF test_part_id IS NULL THEN
    RAISE NOTICE '⚠️ No parts found for testing';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Test part ID: %', test_part_id;
  
  -- Get stock before
  SELECT COALESCE((stock->>'CN1')::int, 0) INTO stock_before
  FROM parts WHERE id = test_part_id;
  RAISE NOTICE 'Stock before: %', stock_before;
  
  -- Call function
  BEGIN
    PERFORM adjust_part_stock(test_part_id, 'CN1', 10::NUMERIC);
    RAISE NOTICE '✅ Function call succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Function call FAILED: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN;
  END;
  
  -- Get stock after
  SELECT COALESCE((stock->>'CN1')::int, 0) INTO stock_after
  FROM parts WHERE id = test_part_id;
  RAISE NOTICE 'Stock after: %', stock_after;
  
  IF stock_after = stock_before + 10 THEN
    RAISE NOTICE '✅ ✅ ✅ SUCCESS! Stock updated from % to %', stock_before, stock_after;
    RAISE NOTICE 'Reverting test change...';
    PERFORM adjust_part_stock(test_part_id, 'CN1', -10::NUMERIC);
    RAISE NOTICE '🧹 Test completed and reverted';
  ELSE
    RAISE NOTICE '❌ ❌ ❌ FAILED! Stock was not updated';
    RAISE NOTICE 'Expected: %, Got: %', stock_before + 10, stock_after;
  END IF;
END $$;
