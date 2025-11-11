-- Suppliers table + RLS (idempotent)
-- Run this after base schema if suppliers is missing, or safely re-run.

-- Create table ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful index for quick search by name
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- RLS policies ---------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.suppliers') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_select'
    ) THEN
      EXECUTE 'CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO authenticated USING (TRUE)';
    END IF;

    -- Relax insert policy to allow all authenticated users to create suppliers
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_insert'
    ) THEN
      EXECUTE 'DROP POLICY suppliers_insert ON public.suppliers';
    END IF;
    EXECUTE 'CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT TO authenticated WITH CHECK ( TRUE )';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_update'
    ) THEN
      EXECUTE 'CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_delete'
    ) THEN
      EXECUTE 'CREATE POLICY suppliers_delete ON public.suppliers FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;
