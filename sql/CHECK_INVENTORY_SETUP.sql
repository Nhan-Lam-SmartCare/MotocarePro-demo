-- ============================================
-- CHECK INVENTORY SYSTEM SETUP
-- Run this to verify what's missing
-- ============================================

-- 1. Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
    ) THEN '✅ Table inventory_transactions EXISTS'
    ELSE '❌ Table inventory_transactions MISSING'
  END AS table_status;

-- 2. Check if function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'adjust_part_stock'
    ) THEN '✅ Function adjust_part_stock EXISTS'
    ELSE '❌ Function adjust_part_stock MISSING'
  END AS function_status;

-- 3. Show function signature if exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'adjust_part_stock';

-- 4. Check if trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_tx_after_insert'
    ) THEN '✅ Trigger trg_inventory_tx_after_insert EXISTS'
    ELSE '❌ Trigger trg_inventory_tx_after_insert MISSING'
  END AS trigger_status;

-- 5. Show all triggers on inventory_transactions table
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'public.inventory_transactions'::regclass;
