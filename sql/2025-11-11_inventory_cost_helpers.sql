-- Average cost helper for a part within a branch (weighted by quantity)
-- Compatible with schemas using either branchId/partId (camelCase) or branchid/partid (lowercase)
CREATE OR REPLACE FUNCTION public.mc_avg_cost(p_part_id TEXT, p_branch_id TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_avg NUMERIC := 0;
  c_branch TEXT := 'branchId';
  c_part TEXT := 'partId';
BEGIN
  -- Detect actual column names on inventory_transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='branchId'
  ) THEN
    c_branch := 'branchid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='partId'
  ) THEN
    c_part := 'partid';
  END IF;

  v_sql := format($f$
    SELECT COALESCE(
      NULLIF(SUM(COALESCE(unitPrice,0) * COALESCE(quantity,0)),0)
      / NULLIF(SUM(COALESCE(quantity,0)),0)
    ,0)
    FROM public.inventory_transactions
    WHERE type = 'Nhập kho' AND %I = $1 AND %I = $2 AND unitPrice IS NOT NULL
  $f$, c_branch, c_part);

  EXECUTE v_sql INTO v_avg USING p_branch_id, p_part_id;
  RETURN v_avg;
END;
$$;
