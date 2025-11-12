-- ============================================
-- FORCE DROP ALL TRIGGERS ON INVENTORY_TRANSACTIONS
-- Run this IMMEDIATELY to fix the error
-- ============================================

-- Drop ALL possible trigger variations
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions CASCADE;
DROP TRIGGER IF EXISTS trg_adjust_stock_on_inventory_tx ON public.inventory_transactions CASCADE;
DROP TRIGGER IF EXISTS adjust_stock_trigger ON public.inventory_transactions CASCADE;

-- Drop the function that the trigger calls (if exists)
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, INTEGER) CASCADE;

-- Verify - should show NO triggers
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'inventory_transactions'
    AND trigger_schema = 'public';
  
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All triggers removed from inventory_transactions';
  ELSE
    RAISE WARNING '⚠️  Still have % triggers on inventory_transactions', trigger_count;
  END IF;
  
  -- Show what triggers remain (for debugging)
  FOR trigger_count IN 
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'inventory_transactions'
      AND trigger_schema = 'public'
  LOOP
    RAISE WARNING 'Found trigger: %', trigger_count;
  END LOOP;
END $$;

-- Show current state
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.inventory_transactions'::regclass
  AND tgisinternal = false;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '🎉 Done! Now refresh your app (Ctrl+F5) and test inventory import.';
END $$;
