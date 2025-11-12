-- KIEM TRA TRIGGER HIEN TAI - CHAY NGAY

SELECT 
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'inventory_transactions'
  AND c.relnamespace = 'public'::regnamespace
  AND t.tgisinternal = false;
