-- =====================================================
-- RLS Enforcement & Branch Auto-fill Triggers
-- Date: 2025-11-10
-- Purpose:
--  - FORCE ROW LEVEL SECURITY for core tables
--  - Auto-populate branchId on INSERT using mc_current_branch()
--  - Idempotent: safe to run multiple times
-- =====================================================

-- Trigger function: set branchId if NULL
CREATE OR REPLACE FUNCTION public.mc_set_branch_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW."branchId" IS NULL THEN
    NEW."branchId" := public.mc_current_branch();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply FORCE RLS + trigger per table (if exists and has branchId)
DO $$
DECLARE
  tbl text;
  has_branch boolean;
  trig_exists boolean;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['work_orders','sales','cash_transactions','inventory_transactions'] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      -- Only act if the table has branchId column
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=tbl AND column_name='branchId'
      ) INTO has_branch;

      IF has_branch THEN
        -- Enforce RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);

        -- Create trigger if missing
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger t
          JOIN pg_class c ON c.oid = t.tgrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname='public' AND c.relname=tbl AND t.tgname='set_branch_id_before_insert'
        ) INTO trig_exists;

        IF NOT trig_exists THEN
          EXECUTE format('CREATE TRIGGER set_branch_id_before_insert BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.mc_set_branch_id();', tbl);
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Optional verification (run manually):
--  SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class c
--  JOIN pg_namespace n ON n.oid=c.relnamespace
--  WHERE n.nspname='public' AND relname IN ('work_orders','sales','cash_transactions','inventory_transactions');
