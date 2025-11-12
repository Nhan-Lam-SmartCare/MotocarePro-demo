-- ============================================
-- FIX INVENTORY TRIGGER WITH RLS BYPASS
-- Trigger cần bypass RLS để có thể cập nhật stock
-- Date: 2025-11-12
-- ============================================

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions;

-- 2. Recreate trigger function with proper permissions
CREATE OR REPLACE FUNCTION public.inventory_tx_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this function execution
  -- SECURITY DEFINER allows function to run with creator's permissions
  
  -- Log for debugging
  RAISE NOTICE 'Trigger executing: type=%, partId=%, quantity=%', 
    NEW.type, NEW."partId", NEW.quantity;
  
  -- Adjust stock based on transaction type
  IF NEW.type = 'Nhập kho' THEN
    -- Increase stock for import
    RAISE NOTICE 'Calling adjust_part_stock with delta: %', NEW.quantity;
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", NEW.quantity);
  ELSIF NEW.type = 'Xuất kho' THEN
    -- Decrease stock for export (negate quantity)
    RAISE NOTICE 'Calling adjust_part_stock with delta: %', -NEW.quantity;
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", -NEW.quantity);
  END IF;
  
  RAISE NOTICE 'Trigger completed successfully';
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error with details
    RAISE WARNING 'ERROR in inventory trigger: % (SQLSTATE: %, DETAIL: %)', 
      SQLERRM, SQLSTATE, SQLERRM;
    -- Still return NEW to allow transaction to complete
    RETURN NEW;
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.inventory_tx_after_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_part_stock(TEXT, TEXT, NUMERIC) TO authenticated;

-- 4. Create trigger
CREATE TRIGGER trg_inventory_tx_after_insert
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION public.inventory_tx_after_insert();

-- 5. Verify and test
DO $$
DECLARE
  v_test_part_id TEXT;
  v_test_branch_id TEXT := 'CN1';
  v_stock_before INT;
  v_stock_after INT;
  v_tx_id TEXT;
BEGIN
  -- Find any existing part for testing
  SELECT id INTO v_test_part_id FROM public.parts LIMIT 1;
  
  IF v_test_part_id IS NULL THEN
    RAISE NOTICE '⚠️  No parts found for testing. Skipping test.';
    RETURN;
  END IF;

  RAISE NOTICE '=== TESTING TRIGGER ===';
  RAISE NOTICE 'Test part ID: %', v_test_part_id;

  -- Get stock before
  SELECT COALESCE((stock->>v_test_branch_id)::int, 0) INTO v_stock_before
  FROM public.parts WHERE id = v_test_part_id;
  
  RAISE NOTICE 'Stock before: %', v_stock_before;

  -- Generate unique ID for test transaction
  v_tx_id := 'test-trigger-' || gen_random_uuid()::text;

  -- Insert test transaction
  RAISE NOTICE 'Inserting test transaction...';
  INSERT INTO public.inventory_transactions (
    id, type, "partId", "partName", quantity, date, 
    "unitPrice", "totalPrice", "branchId", notes
  )
  VALUES (
    v_tx_id,
    'Nhập kho',
    v_test_part_id,
    'Test Part',
    5,
    NOW(),
    10000,
    50000,
    v_test_branch_id,
    'TEST: Trigger verification - AUTO DELETE'
  );

  -- Small delay to ensure trigger completes
  PERFORM pg_sleep(0.5);

  -- Get stock after
  SELECT COALESCE((stock->>v_test_branch_id)::int, 0) INTO v_stock_after
  FROM public.parts WHERE id = v_test_part_id;
  
  RAISE NOTICE 'Stock after: %', v_stock_after;

  IF v_stock_after = v_stock_before + 5 THEN
    RAISE NOTICE '✅ ✅ ✅ TRIGGER TEST PASSED! Stock increased from % to %', 
      v_stock_before, v_stock_after;
    
    -- Clean up test transaction
    DELETE FROM public.inventory_transactions WHERE id = v_tx_id;
    
    -- Revert stock
    PERFORM public.adjust_part_stock(v_test_part_id, v_test_branch_id, -5);
    RAISE NOTICE '🧹 Test data cleaned up';
  ELSE
    RAISE WARNING '❌ ❌ ❌ TRIGGER TEST FAILED!';
    RAISE WARNING 'Expected stock: %, Actual stock: %', v_stock_before + 5, v_stock_after;
    RAISE WARNING 'Trigger may not be executing or adjust_part_stock is failing';
    
    -- Clean up failed test
    DELETE FROM public.inventory_transactions WHERE id = v_tx_id;
  END IF;
END $$;

-- 6. Show trigger status
SELECT 
  'Trigger Status' as check_type,
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_timing as timing
FROM information_schema.triggers
WHERE trigger_name = 'trg_inventory_tx_after_insert';
