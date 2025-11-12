-- ============================================
-- KIỂM TRA HIỆN TRẠNG DATABASE
-- Chạy script này để xem có gì trong database
-- ============================================

-- 1. Kiểm tra bảng inventory_transactions có tồn tại không?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
    ) 
    THEN '✅ Bảng inventory_transactions TỒN TẠI'
    ELSE '❌ Bảng inventory_transactions KHÔNG TỒN TẠI'
  END as table_status;

-- 2. Kiểm tra có trigger nào không?
SELECT 
  'Trigger: ' || tgname as name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'inventory_transactions'
  AND c.relnamespace = 'public'::regnamespace
  AND t.tgisinternal = false;

-- 3. Kiểm tra có function adjust_part_stock không?
SELECT 
  'Function: ' || p.proname || '(' || pg_get_function_arguments(p.oid) || ')' as function_signature,
  '⚠️ TỒN TẠI - CẦN XÓA!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%adjust_part_stock%';

-- 4. Kiểm tra có function inventory_tx_after_insert không?
SELECT 
  'Function: ' || p.proname || '()' as function_signature,
  '⚠️ TỒN TẠI - CẦN XÓA!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%inventory_tx%';

-- 5. Kiểm tra RLS policies
SELECT 
  'Policy: ' || polname as policy_name,
  CASE 
    WHEN polcmd = 'r' THEN 'SELECT'
    WHEN polcmd = 'a' THEN 'INSERT'
    WHEN polcmd = 'w' THEN 'UPDATE'
    WHEN polcmd = 'd' THEN 'DELETE'
    ELSE 'ALL'
  END as command_type
FROM pg_policy
WHERE polrelid = 'public.inventory_transactions'::regclass;
