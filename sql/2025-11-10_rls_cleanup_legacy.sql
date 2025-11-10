-- =====================================================
-- RLS Cleanup for Legacy/Shadow Tables
-- Date: 2025-11-10
-- Purpose: Remove permissive 'Allow all for authenticated users' policies
--          left on legacy tables and ensure RLS is enabled.
--          This script is safe to run multiple times.
--          If these tables are still in use, consider adding proper policies.
-- =====================================================

-- Helper: drop a specific policy name if table exists
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT unnest(ARRAY[
    'motocare_customers',
    'motocare_parts',
    'motocare_workorders',
    'motocare_sales',
    'motocare_inventorytransactions',
    'cashtransactions', -- no underscore legacy
    'paymentsources',   -- no underscore legacy
    'suppliers',
    'goodsreceipts',
    'store_settings'
  ]) AS tablename LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=rec.tablename
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
      -- Drop generic policy name if present
      IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename=rec.tablename AND policyname='Allow all for authenticated users'
      ) THEN
        EXECUTE format('DROP POLICY "Allow all for authenticated users" ON public.%I;', rec.tablename);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Optional: block access completely by adding a deny-all policy placeholder
-- so that accidental access fails clearly (uncomment if desired):
-- DO $$ BEGIN
--   IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='cashtransactions') THEN
--     CREATE POLICY IF NOT EXISTS cashtransactions_deny_all ON public.cashtransactions FOR ALL TO authenticated USING (false);
--   END IF;
-- END $$;

-- Verification helper (run manually):
--   SELECT policyname, tablename, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
