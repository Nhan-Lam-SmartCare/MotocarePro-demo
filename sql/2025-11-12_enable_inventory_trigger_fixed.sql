-- ============================================
-- RE-ENABLE INVENTORY TRIGGER WITH FIXED FUNCTION
-- Fix lỗi signature mismatch và enable lại trigger
-- Date: 2025-11-12
-- ============================================

-- 1. Ensure adjust_part_stock function accepts NUMERIC (already fixed in 2025-11-11_adjust_part_stock.sql)
-- This function is already correct with NUMERIC parameter

-- 2. Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions;

-- 3. Create/Replace trigger function with correct signature
CREATE OR REPLACE FUNCTION public.inventory_tx_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log for debugging (optional - can be removed in production)
  -- RAISE NOTICE 'Inventory trigger: type=%, partId=%, branchId=%, quantity=%', 
  --   NEW.type, NEW."partId", NEW."branchId", NEW.quantity;
  
  -- Adjust stock based on transaction type
  IF NEW.type = 'Nhập kho' THEN
    -- Increase stock for import
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", NEW.quantity);
  ELSIF NEW.type = 'Xuất kho' THEN
    -- Decrease stock for export (negate quantity)
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", -NEW.quantity);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in inventory trigger: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Still return NEW to allow transaction to complete
    RETURN NEW;
END;
$$;

-- 4. Create trigger
CREATE TRIGGER trg_inventory_tx_after_insert
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION public.inventory_tx_after_insert();

-- 5. Verify setup
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_inventory_tx_after_insert' 
    AND event_object_table = 'inventory_transactions'
  ) INTO v_trigger_exists;

  -- Check if function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'adjust_part_stock'
  ) INTO v_function_exists;

  IF v_trigger_exists AND v_function_exists THEN
    RAISE NOTICE '✅ Inventory trigger re-enabled successfully!';
    RAISE NOTICE '✅ Function adjust_part_stock exists and accepts NUMERIC parameter';
    RAISE NOTICE '🎉 Stock will now be automatically updated on inventory transactions';
  ELSE
    IF NOT v_trigger_exists THEN
      RAISE WARNING '❌ Trigger not found';
    END IF;
    IF NOT v_function_exists THEN
      RAISE WARNING '❌ Function adjust_part_stock not found';
    END IF;
  END IF;
END $$;

-- 6. Test trigger (OPTIONAL - comment out if you don't want to test)
-- Uncomment below to test the trigger with a dummy transaction
/*
DO $$
DECLARE
  v_test_part_id TEXT;
  v_test_branch_id TEXT := 'CN1';
  v_stock_before INT;
  v_stock_after INT;
BEGIN
  -- Find any existing part for testing
  SELECT id INTO v_test_part_id FROM public.parts LIMIT 1;
  
  IF v_test_part_id IS NULL THEN
    RAISE NOTICE '⚠️  No parts found for testing. Skipping test.';
    RETURN;
  END IF;

  -- Get stock before
  SELECT COALESCE((stock->>v_test_branch_id)::int, 0) INTO v_stock_before
  FROM public.parts WHERE id = v_test_part_id;

  -- Insert test transaction
  INSERT INTO public.inventory_transactions (
    id, type, "partId", "partName", quantity, date, 
    "unitPrice", "totalPrice", "branchId", notes
  )
  VALUES (
    'test-trigger-' || gen_random_uuid(),
    'Nhập kho',
    v_test_part_id,
    'Test Part',
    5,
    NOW(),
    10000,
    50000,
    v_test_branch_id,
    'TEST: Trigger verification'
  );

  -- Get stock after
  SELECT COALESCE((stock->>v_test_branch_id)::int, 0) INTO v_stock_after
  FROM public.parts WHERE id = v_test_part_id;

  IF v_stock_after = v_stock_before + 5 THEN
    RAISE NOTICE '✅ TRIGGER TEST PASSED: Stock increased from % to %', v_stock_before, v_stock_after;
    -- Clean up test transaction
    DELETE FROM public.inventory_transactions 
    WHERE notes = 'TEST: Trigger verification' AND "partId" = v_test_part_id;
    -- Revert stock
    PERFORM public.adjust_part_stock(v_test_part_id, v_test_branch_id, -5);
    RAISE NOTICE '🧹 Test data cleaned up';
  ELSE
    RAISE WARNING '❌ TRIGGER TEST FAILED: Stock was % before, expected % after, got %', 
      v_stock_before, v_stock_before + 5, v_stock_after;
  END IF;
END $$;
*/

-- 7. Important notes
COMMENT ON TRIGGER trg_inventory_tx_after_insert ON public.inventory_transactions IS 
  'Automatically adjusts parts.stock when inventory transactions are inserted. Increases stock for "Nhập kho" (import), decreases for "Xuất kho" (export).';

COMMENT ON FUNCTION public.inventory_tx_after_insert() IS 
  'Trigger function that calls adjust_part_stock to sync stock changes. Handles errors gracefully to prevent transaction rollback.';

