-- Indexes for performance (idempotent, resilient to snake_case / camelCase)
DO $$
DECLARE
  -- sales
  sales_branch_col text;
  sales_date_col   text;
  -- cash_transactions
  cash_branch_col text;
  cash_date_col   text;
  cash_cat_col    text;
  -- inventory_transactions
  inv_branch_col text;
  inv_date_col   text;
  -- work_orders
  wo_branch_col text;
  wo_status_col text;
BEGIN
  -- Resolve columns for sales
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='sales' AND column_name='branchId'
           ) THEN 'branchId'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='sales' AND column_name='branch_id'
           ) THEN 'branch_id'
           ELSE NULL
         END INTO sales_branch_col;
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='sales' AND column_name='date'
           ) THEN 'date'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='sales' AND column_name='created_at'
           ) THEN 'created_at'
           ELSE NULL
         END INTO sales_date_col;

  IF sales_branch_col IS NOT NULL AND sales_date_col IS NOT NULL THEN
    IF to_regclass('public.sales_branch_date_idx') IS NULL THEN
      EXECUTE format('CREATE INDEX sales_branch_date_idx ON public.sales (%I, %I)', sales_branch_col, sales_date_col);
    END IF;
  END IF;

  -- Resolve columns for cash_transactions
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='branchId'
           ) THEN 'branchId'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='branch_id'
           ) THEN 'branch_id'
           ELSE NULL
         END INTO cash_branch_col;
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='date'
           ) THEN 'date'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='created_at'
           ) THEN 'created_at'
           ELSE NULL
         END INTO cash_date_col;
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cash_transactions' AND column_name='category'
           ) THEN 'category'
           ELSE NULL
         END INTO cash_cat_col;

  IF cash_branch_col IS NOT NULL AND cash_date_col IS NOT NULL THEN
    IF to_regclass('public.cash_transactions_branch_date_cat_idx') IS NULL THEN
      IF cash_cat_col IS NOT NULL THEN
        EXECUTE format(
          'CREATE INDEX cash_transactions_branch_date_cat_idx ON public.cash_transactions (%I, %I, %I)',
          cash_branch_col, cash_date_col, cash_cat_col
        );
      ELSE
        -- Fallback 2-column index if category doesn't exist
        EXECUTE format(
          'CREATE INDEX cash_transactions_branch_date_idx ON public.cash_transactions (%I, %I)',
          cash_branch_col, cash_date_col
        );
      END IF;
    END IF;
  END IF;

  -- Resolve columns for inventory_transactions
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='branchId'
           ) THEN 'branchId'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='branch_id'
           ) THEN 'branch_id'
           ELSE NULL
         END INTO inv_branch_col;
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='date'
           ) THEN 'date'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='created_at'
           ) THEN 'created_at'
           ELSE NULL
         END INTO inv_date_col;

  IF inv_branch_col IS NOT NULL AND inv_date_col IS NOT NULL THEN
    IF to_regclass('public.inventory_transactions_branch_date_idx') IS NULL THEN
      EXECUTE format('CREATE INDEX inventory_transactions_branch_date_idx ON public.inventory_transactions (%I, %I)', inv_branch_col, inv_date_col);
    END IF;
  END IF;

  -- Resolve columns for work_orders
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='work_orders' AND column_name='branchId'
           ) THEN 'branchId'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='work_orders' AND column_name='branch_id'
           ) THEN 'branch_id'
           ELSE NULL
         END INTO wo_branch_col;
  SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='work_orders' AND column_name='status'
           ) THEN 'status'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='work_orders' AND column_name='state'
           ) THEN 'state'
           ELSE NULL
         END INTO wo_status_col;

  IF wo_branch_col IS NOT NULL AND wo_status_col IS NOT NULL THEN
    IF to_regclass('public.work_orders_branch_status_idx') IS NULL THEN
      EXECUTE format('CREATE INDEX work_orders_branch_status_idx ON public.work_orders (%I, %I)', wo_branch_col, wo_status_col);
    END IF;
  END IF;
END$$;
