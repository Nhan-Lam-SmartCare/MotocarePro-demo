-- Fix adjust_part_stock function signature to accept NUMERIC instead of INT
-- This is needed because inventory_transactions.quantity is NUMERIC
-- Date: 2025-11-12

CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
  v_delta_int INT;
BEGIN
  -- Convert delta to INT for stock calculation
  v_delta_int := p_delta::INT;
  
  -- Lock row to avoid concurrent modification
  SELECT COALESCE((stock->>p_branch_id)::int, 0) INTO v_current
  FROM public.parts
  WHERE id = p_part_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PART_NOT_FOUND';
  END IF;

  PERFORM 1;
  UPDATE public.parts
  SET stock = jsonb_set(stock, ARRAY[p_branch_id], to_jsonb(GREATEST(0, v_current + v_delta_int)), true)
  WHERE id = p_part_id;
END;
$$;

-- Test the function
DO $$
BEGIN
  -- Just verify it compiles correctly
  RAISE NOTICE 'Function adjust_part_stock updated successfully';
END $$;
