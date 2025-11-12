-- KIEM TRA KET QUA SAU KHI XOA

-- 1. Dem trigger
SELECT COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'inventory_transactions'
  AND c.relnamespace = 'public'::regnamespace
  AND t.tgisinternal = false;

-- 2. Dem function
SELECT COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%adjust_part_stock%' OR p.proname LIKE '%inventory_tx_after_insert%');

-- 3. Kiem tra bang ton tai
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
) as table_exists;
