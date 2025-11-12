-- XOA TAT CA TRIGGER VA FUNCTION
-- Script don gian nhat - khong co ky tu dac biet

-- Buoc 1: Xoa tat ca trigger
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
    RAISE NOTICE 'Da xoa trigger: %', r.tgname;
  END LOOP;
END $$;

-- Buoc 2: Xoa tat ca function
DROP FUNCTION IF EXISTS public.inventory_tx_after_insert() CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, DOUBLE PRECISION) CASCADE;

-- Buoc 3: Kiem tra lai
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'inventory_transactions'
    AND c.relnamespace = 'public'::regnamespace
    AND t.tgisinternal = false;
  
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND (p.proname LIKE '%adjust_part_stock%' OR p.proname LIKE '%inventory_tx_after_insert%');
  
  IF trigger_count = 0 THEN
    RAISE NOTICE 'THANH CONG: Da xoa tat ca trigger';
  ELSE
    RAISE WARNING 'Van con % trigger', trigger_count;
  END IF;
  
  IF function_count = 0 THEN
    RAISE NOTICE 'THANH CONG: Da xoa tat ca function';
  ELSE
    RAISE WARNING 'Van con % function', function_count;
  END IF;
  
  IF trigger_count = 0 AND function_count = 0 THEN
    RAISE NOTICE 'HOAN TAT! Bay gio:';
    RAISE NOTICE '1. Nhan Ctrl+F5 de refresh app';
    RAISE NOTICE '2. Thu nhap kho lai';
    RAISE NOTICE '3. Se KHONG CON LOI!';
  END IF;
END $$;
