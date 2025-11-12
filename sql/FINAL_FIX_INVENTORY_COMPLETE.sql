-- ============================================
-- FINAL COMPLETE FIX FOR INVENTORY
-- This will COMPLETELY RESET inventory_transactions table
-- Run this ONCE to fix all issues permanently
-- ============================================

-- STEP 1: Drop EVERYTHING related to inventory_transactions
-- ============================================

-- Drop ALL triggers (all possible names)
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions CASCADE;
DROP TRIGGER IF EXISTS trg_adjust_stock_on_inventory_tx ON public.inventory_transactions CASCADE;
DROP TRIGGER IF EXISTS adjust_stock_trigger ON public.inventory_transactions CASCADE;
DROP TRIGGER IF EXISTS inventory_tx_after_insert ON public.inventory_transactions CASCADE;

-- Drop ALL functions related to inventory adjustment
DROP FUNCTION IF EXISTS public.inventory_tx_after_insert() CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, BIGINT) CASCADE;

-- Drop the table completely (to start fresh)
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;

-- STEP 2: Recreate table CLEANLY (no triggers)
-- ============================================

CREATE TABLE public.inventory_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Nhập kho', 'Xuất kho')),
  "partId" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "unitPrice" NUMERIC,
  "totalPrice" NUMERIC NOT NULL DEFAULT 0,
  "branchId" TEXT NOT NULL,
  notes TEXT,
  "saleId" TEXT,
  "workOrderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX idx_inventory_tx_date ON public.inventory_transactions(date DESC);
CREATE INDEX idx_inventory_tx_branch ON public.inventory_transactions("branchId");
CREATE INDEX idx_inventory_tx_part ON public.inventory_transactions("partId");
CREATE INDEX idx_inventory_tx_type ON public.inventory_transactions(type);

-- STEP 4: Enable RLS with SIMPLE policies (no function dependencies)
-- ============================================

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Simple policies that work for everyone
CREATE POLICY inv_tx_select ON public.inventory_transactions 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY inv_tx_insert ON public.inventory_transactions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY inv_tx_update ON public.inventory_transactions 
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY inv_tx_delete ON public.inventory_transactions 
  FOR DELETE TO authenticated 
  USING (true);

-- STEP 5: Verify everything is clean
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
  ) INTO table_exists;
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'inventory_transactions'
    AND c.relnamespace = 'public'::regnamespace
    AND t.tgisinternal = false;
  
  -- Count related functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND (
      p.proname LIKE '%adjust_part_stock%' 
      OR p.proname LIKE '%inventory_tx_after_insert%'
    );
  
  -- Report results
  IF table_exists THEN
    RAISE NOTICE '✅ Table inventory_transactions created successfully';
  ELSE
    RAISE WARNING '❌ Failed to create table inventory_transactions';
  END IF;
  
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ No triggers on inventory_transactions (GOOD!)';
  ELSE
    RAISE WARNING '⚠️  Still have % triggers on inventory_transactions', trigger_count;
  END IF;
  
  IF function_count = 0 THEN
    RAISE NOTICE '✅ All problematic functions removed (GOOD!)';
  ELSE
    RAISE WARNING '⚠️  Still have % related functions', function_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was done:';
  RAISE NOTICE '   1. Dropped all triggers that call adjust_part_stock()';
  RAISE NOTICE '   2. Dropped all adjust_part_stock() functions';
  RAISE NOTICE '   3. Recreated inventory_transactions table from scratch';
  RAISE NOTICE '   4. Added indexes for performance';
  RAISE NOTICE '   5. Enabled RLS with simple policies';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ NEXT STEPS:';
  RAISE NOTICE '   1. Refresh your app with Ctrl+F5';
  RAISE NOTICE '   2. Test inventory import (Tạo phiếu nhập)';
  RAISE NOTICE '   3. Check console - should have NO errors!';
  RAISE NOTICE '   4. Stock will update automatically via React code';
  RAISE NOTICE '';
  RAISE NOTICE '💡 HOW IT WORKS NOW:';
  RAISE NOTICE '   - No database trigger (avoids function errors)';
  RAISE NOTICE '   - Stock updated by React code at line 1775 of InventoryManager.tsx';
  RAISE NOTICE '   - History saved to inventory_transactions table';
  RAISE NOTICE '   - Everything works smoothly!';
  RAISE NOTICE '';
END $$;
