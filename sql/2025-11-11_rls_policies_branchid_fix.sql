-- RLS policy additions for schemas using lowercase branchid column
-- Idempotent: only creates policies if table/column exists and policy name not already present.

DO $$
BEGIN
  IF to_regclass('public.sales') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='sales' AND column_name='branchid'
    ) THEN
      -- SELECT policy using branchid
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_select_branchid'
      ) THEN
        EXECUTE 'CREATE POLICY sales_select_branchid ON public.sales FOR SELECT TO authenticated USING ( branchid = public.mc_current_branch() OR public.mc_is_manager_or_owner() )';
      END IF;
      -- INSERT policy using branchid
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_insert_branchid'
      ) THEN
        EXECUTE 'CREATE POLICY sales_insert_branchid ON public.sales FOR INSERT TO authenticated WITH CHECK ( branchid = public.mc_current_branch() )';
      END IF;
      -- UPDATE policy using branchid
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_update_branchid'
      ) THEN
        EXECUTE 'CREATE POLICY sales_update_branchid ON public.sales FOR UPDATE TO authenticated USING ( branchid = public.mc_current_branch() ) WITH CHECK ( branchid = public.mc_current_branch() )';
      END IF;
    END IF;
  END IF;
END $$;
