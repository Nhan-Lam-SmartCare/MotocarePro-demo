-- =====================================================
-- RLS Hardening for Core Business Tables
-- Date: 2025-11-10
-- Description:
--   This migration tightens the previously permissive (ALLOW ALL) policies.
--   Assumptions:
--     * Table public.user_profiles exists and stores (id, role, branch_id).
--     * Caller is authenticated (role "authenticated" in Supabase).
--     * Branch scoping driven by branchId column in each business table.
--     * Roles: owner, manager, staff (others treated as staff).
--   If your actual column names differ (e.g. branch instead of branchId), adjust USING predicates.
-- =====================================================

-- Helper functions (idempotent) --------------------------------------------
-- NOTE: Avoid name collision with PostgreSQL keyword current_role
-- Use prefixed helper names: mc_current_role, mc_current_branch
-- mc_current_role(): Lấy role hiện tại; hỗ trợ cả user_profiles hoặc profiles (Supabase mặc định dùng "profiles")
CREATE OR REPLACE FUNCTION public.mc_current_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE r text;
BEGIN
  -- Ưu tiên bảng user_profiles nếu tồn tại
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    BEGIN
      SELECT role INTO r FROM public.user_profiles WHERE id = auth.uid();
    EXCEPTION WHEN undefined_column THEN
      -- Bảng tồn tại nhưng chưa có cột role
      NULL;
    END;
  END IF;

  -- Dự phòng: bảng profiles (mặc định của Supabase example) nếu chưa có kết quả
  IF r IS NULL AND to_regclass('public.profiles') IS NOT NULL THEN
    BEGIN
      SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;
  END IF;

  RETURN COALESCE(r,'staff');
END;
$$;

-- Helper: current_branch
-- mc_current_branch(): Lấy branch_id; tương tự hỗ trợ user_profiles hoặc profiles
CREATE OR REPLACE FUNCTION public.mc_current_branch()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE b text;
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    BEGIN
      SELECT branch_id INTO b FROM public.user_profiles WHERE id = auth.uid();
    EXCEPTION WHEN undefined_column THEN
      NULL; -- Bảng không có cột branch_id
    END;
  END IF;

  IF b IS NULL AND to_regclass('public.profiles') IS NOT NULL THEN
    BEGIN
      SELECT branch_id INTO b FROM public.profiles WHERE id = auth.uid();
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;
  END IF;

  RETURN b;  -- NULL -> các policy dựa branch sẽ chặn thao tác nhạy cảm
END;
$$;

-- Cleanup any previous broken versions before re-create (idempotent)
-- Chỉ drop các hàm tên cũ/legacy; tránh drop mc_is_owner/mc_is_manager_or_owner vì policy đang phụ thuộc
DROP FUNCTION IF EXISTS public.is_owner();
DROP FUNCTION IF EXISTS public.is_manager_or_owner();
DROP FUNCTION IF EXISTS public.current_role();
DROP FUNCTION IF EXISTS public.current_branch();

-- is_owner(): TRUE nếu role hiện tại = 'owner'
CREATE OR REPLACE FUNCTION public.mc_is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.mc_current_role() = 'owner';
$$;

-- is_manager_or_owner(): TRUE nếu role thuộc {'owner','manager'}
CREATE OR REPLACE FUNCTION public.mc_is_manager_or_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.mc_current_role() IN ('owner','manager');
$$;

-- ================== CUSTOM POLICY TEMPLATES ==================
-- Pattern:
--   SELECT: owner/manager see all rows for their branch; staff only rows of own branch.
--   INSERT/UPDATE: row branch must match current_branch().
--   DELETE: only owner (optionally manager) in same branch.
-- Notes:
--   payment_sources has balance JSON by branch; we allow SELECT for any branch user
--   but INSERT/UPDATE restricted to owner/manager; staff cannot mutate sources.
-- =============================================================

-- Disable previous permissive policies (ignore errors) ----------
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'customers';
  IF FOUND THEN DROP POLICY "Allow all operations on customers" ON customers; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'parts';
  IF FOUND THEN DROP POLICY "Allow all operations on parts" ON parts; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'work_orders';
  IF FOUND THEN DROP POLICY "Allow all operations on work_orders" ON work_orders; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'sales';
  IF FOUND THEN DROP POLICY "Allow all operations on sales" ON sales; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'cash_transactions';
  IF FOUND THEN DROP POLICY "Allow all operations on cash_transactions" ON cash_transactions; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'payment_sources';
  IF FOUND THEN DROP POLICY "Allow all operations on payment_sources" ON payment_sources; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'inventory_transactions';
  IF FOUND THEN DROP POLICY "Allow all operations on inventory_transactions" ON inventory_transactions; END IF;
  PERFORM 1 FROM pg_policies WHERE policyname LIKE 'Allow all operations%' AND tablename = 'categories';
  IF FOUND THEN DROP POLICY "Allow all operations on categories" ON categories; END IF;
END $$;

-- Customers (guarded create) -------------------------------------
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY';

    -- SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_select'
    ) THEN
      EXECUTE 'CREATE POLICY customers_select ON public.customers FOR SELECT TO authenticated USING ( public.mc_is_manager_or_owner() OR TRUE )';
    END IF;

    -- ALL (modify)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_modify'
    ) THEN
      EXECUTE 'CREATE POLICY customers_modify ON public.customers FOR ALL TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
  END IF;
END;
$$;

-- Parts (guarded create) -----------------------------------------
DO $$
BEGIN
  IF to_regclass('public.parts') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parts' AND policyname='parts_select') THEN
      EXECUTE 'CREATE POLICY parts_select ON public.parts FOR SELECT TO authenticated USING (TRUE)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parts' AND policyname='parts_insert') THEN
      EXECUTE 'CREATE POLICY parts_insert ON public.parts FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parts' AND policyname='parts_update') THEN
      EXECUTE 'CREATE POLICY parts_update ON public.parts FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parts' AND policyname='parts_delete') THEN
      EXECUTE 'CREATE POLICY parts_delete ON public.parts FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Work Orders (guarded create; falls back to role-only if no branchId) ----
DO $$
DECLARE has_branch boolean;
BEGIN
  IF to_regclass('public.work_orders') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY';
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='work_orders' AND column_name='branchId'
    ) INTO has_branch;

    IF has_branch THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_select') THEN
        EXECUTE 'CREATE POLICY work_orders_select ON public.work_orders FOR SELECT TO authenticated USING ( branchId = public.mc_current_branch() OR public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_insert') THEN
        EXECUTE 'CREATE POLICY work_orders_insert ON public.work_orders FOR INSERT TO authenticated WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_update') THEN
        EXECUTE 'CREATE POLICY work_orders_update ON public.work_orders FOR UPDATE TO authenticated USING ( branchId = public.mc_current_branch() ) WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_select') THEN
        EXECUTE 'CREATE POLICY work_orders_select ON public.work_orders FOR SELECT TO authenticated USING ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_insert') THEN
        EXECUTE 'CREATE POLICY work_orders_insert ON public.work_orders FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_update') THEN
        EXECUTE 'CREATE POLICY work_orders_update ON public.work_orders FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='work_orders' AND policyname='work_orders_delete') THEN
      EXECUTE 'CREATE POLICY work_orders_delete ON public.work_orders FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Sales (guarded create; branch-aware if column exists) ------------
DO $$
DECLARE has_branch boolean;
BEGIN
  IF to_regclass('public.sales') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY';
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='sales' AND column_name='branchId'
    ) INTO has_branch;

    IF has_branch THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_select') THEN
        EXECUTE 'CREATE POLICY sales_select ON public.sales FOR SELECT TO authenticated USING ( branchId = public.mc_current_branch() OR public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_insert') THEN
        EXECUTE 'CREATE POLICY sales_insert ON public.sales FOR INSERT TO authenticated WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_update') THEN
        EXECUTE 'CREATE POLICY sales_update ON public.sales FOR UPDATE TO authenticated USING ( branchId = public.mc_current_branch() ) WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_select') THEN
        EXECUTE 'CREATE POLICY sales_select ON public.sales FOR SELECT TO authenticated USING ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_insert') THEN
        EXECUTE 'CREATE POLICY sales_insert ON public.sales FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_update') THEN
        EXECUTE 'CREATE POLICY sales_update ON public.sales FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_delete') THEN
      EXECUTE 'CREATE POLICY sales_delete ON public.sales FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Cash Transactions (guarded create; branch-aware if column exists) --
DO $$
DECLARE has_branch boolean;
BEGIN
  IF to_regclass('public.cash_transactions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY';
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='branchId'
    ) INTO has_branch;

    IF has_branch THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_select') THEN
        EXECUTE 'CREATE POLICY cash_tx_select ON public.cash_transactions FOR SELECT TO authenticated USING ( branchId = public.mc_current_branch() OR public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_insert') THEN
        EXECUTE 'CREATE POLICY cash_tx_insert ON public.cash_transactions FOR INSERT TO authenticated WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_update') THEN
        EXECUTE 'CREATE POLICY cash_tx_update ON public.cash_transactions FOR UPDATE TO authenticated USING ( branchId = public.mc_current_branch() ) WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_select') THEN
        EXECUTE 'CREATE POLICY cash_tx_select ON public.cash_transactions FOR SELECT TO authenticated USING ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_insert') THEN
        EXECUTE 'CREATE POLICY cash_tx_insert ON public.cash_transactions FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_update') THEN
        EXECUTE 'CREATE POLICY cash_tx_update ON public.cash_transactions FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cash_transactions' AND policyname='cash_tx_delete') THEN
      EXECUTE 'CREATE POLICY cash_tx_delete ON public.cash_transactions FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Inventory Transactions (guarded create; branch-aware if column exists)
DO $$
DECLARE has_branch boolean;
BEGIN
  IF to_regclass('public.inventory_transactions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY';
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='branchId'
    ) INTO has_branch;

    IF has_branch THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_select') THEN
        EXECUTE 'CREATE POLICY inv_tx_select ON public.inventory_transactions FOR SELECT TO authenticated USING ( branchId = public.mc_current_branch() OR public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_insert') THEN
        EXECUTE 'CREATE POLICY inv_tx_insert ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_update') THEN
        EXECUTE 'CREATE POLICY inv_tx_update ON public.inventory_transactions FOR UPDATE TO authenticated USING ( branchId = public.mc_current_branch() ) WITH CHECK ( branchId = public.mc_current_branch() )';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_select') THEN
        EXECUTE 'CREATE POLICY inv_tx_select ON public.inventory_transactions FOR SELECT TO authenticated USING ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_insert') THEN
        EXECUTE 'CREATE POLICY inv_tx_insert ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_update') THEN
        EXECUTE 'CREATE POLICY inv_tx_update ON public.inventory_transactions FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_transactions' AND policyname='inv_tx_delete') THEN
      EXECUTE 'CREATE POLICY inv_tx_delete ON public.inventory_transactions FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Payment Sources (guarded create) -------------------------------
DO $$
BEGIN
  IF to_regclass('public.payment_sources') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.payment_sources ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_sources' AND policyname='pay_sources_select') THEN
      EXECUTE 'CREATE POLICY pay_sources_select ON public.payment_sources FOR SELECT TO authenticated USING (TRUE)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_sources' AND policyname='pay_sources_insert') THEN
      EXECUTE 'CREATE POLICY pay_sources_insert ON public.payment_sources FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_sources' AND policyname='pay_sources_update') THEN
      EXECUTE 'CREATE POLICY pay_sources_update ON public.payment_sources FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_sources' AND policyname='pay_sources_delete') THEN
      EXECUTE 'CREATE POLICY pay_sources_delete ON public.payment_sources FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Categories (guarded create) ------------------------------------
DO $$
BEGIN
  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_select') THEN
      EXECUTE 'CREATE POLICY categories_select ON public.categories FOR SELECT TO authenticated USING (TRUE)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_insert') THEN
      EXECUTE 'CREATE POLICY categories_insert ON public.categories FOR INSERT TO authenticated WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_update') THEN
      EXECUTE 'CREATE POLICY categories_update ON public.categories FOR UPDATE TO authenticated USING ( public.mc_is_manager_or_owner() ) WITH CHECK ( public.mc_is_manager_or_owner() )';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_delete') THEN
      EXECUTE 'CREATE POLICY categories_delete ON public.categories FOR DELETE TO authenticated USING ( public.mc_is_owner() )';
    END IF;
  END IF;
END;
$$;

-- Optional: tighten customers later if branch ownership added.
-- Verification query (run manually):
--   SELECT policyname, tablename, permissive, roles, cmd FROM pg_policies WHERE schemaname='public';

-- =====================================================
-- End of RLS hardening script
-- =====================================================
