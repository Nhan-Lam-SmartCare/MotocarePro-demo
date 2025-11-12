-- Fix mc_avg_cost to use quoted column names
-- Date: 2025-11-12

CREATE OR REPLACE FUNCTION public.mc_avg_cost(p_part_id TEXT, p_branch_id TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg NUMERIC := 0;
BEGIN
  -- Use quoted column names for camelCase columns
  SELECT COALESCE(
    NULLIF(SUM(COALESCE("unitPrice",0) * COALESCE(quantity,0)),0)
    / NULLIF(SUM(COALESCE(quantity,0)),0)
  ,0)
  INTO v_avg
  FROM public.inventory_transactions
  WHERE type = 'Nhập kho' 
    AND "branchId" = p_branch_id 
    AND "partId" = p_part_id 
    AND "unitPrice" IS NOT NULL;

  RETURN v_avg;
END;
$$;

COMMENT ON FUNCTION public.mc_avg_cost(TEXT, TEXT) IS 
  'Returns weighted average cost for a part in a branch based on import transactions (Nhập kho).';

GRANT EXECUTE ON FUNCTION public.mc_avg_cost(TEXT, TEXT) TO authenticated;
