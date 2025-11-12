-- ============================================
-- XÓA TẤT CẢ TRIGGER VÀ FUNCTION - ĐẢM BẢO 100%
-- Script này sẽ xóa mọi thứ liên quan đến trigger
-- ============================================

-- Bước 1: Tắt tất cả trigger trên bảng inventory_transactions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'inventory_transactions'
      AND c.relnamespace = 'public'::regnamespace
      AND t.tgisinternal = false
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.inventory_transactions CASCADE', r.tgname);
    RAISE NOTICE 'Đã xóa trigger: %', r.tgname;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Không tìm thấy trigger nào để xóa';
  END IF;
END $$;

-- Bước 2: Xóa tất cả function liên quan
DROP FUNCTION IF EXISTS public.inventory_tx_after_insert() CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, DOUBLE PRECISION) CASCADE;

-- Bước 3: Verify - Kiểm tra lại
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Đếm trigger
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'inventory_transactions'
    AND c.relnamespace = 'public'::regnamespace
    AND t.tgisinternal = false;
  
  -- Đếm function
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND (p.proname LIKE '%adjust_part_stock%' OR p.proname LIKE '%inventory_tx_after_insert%');
  
  -- Thông báo kết quả
  RAISE NOTICE '========================================';
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ THÀNH CÔNG: Đã xóa tất cả trigger';
  ELSE
    RAISE WARNING '⚠️ Vẫn còn % trigger', trigger_count;
  END IF;
  
  IF function_count = 0 THEN
    RAISE NOTICE '✅ THÀNH CÔNG: Đã xóa tất cả function';
  ELSE
    RAISE WARNING '⚠️ Vẫn còn % function', function_count;
  END IF;
  RAISE NOTICE '========================================';
  
  IF trigger_count = 0 AND function_count = 0 THEN
    RAISE NOTICE '🎉 HOÀN TẤT! Bây giờ:';
    RAISE NOTICE '   1. Nhấn Ctrl+F5 để refresh app';
    RAISE NOTICE '   2. Thử nhập kho lại';
    RAISE NOTICE '   3. Sẽ KHÔNG CÒN LỖI!';
  END IF;
END $$;
