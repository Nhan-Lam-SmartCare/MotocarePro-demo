-- Adjust part stock per branch (JSONB) with row lock to prevent race
-- Usage: SELECT public.adjust_part_stock('<partId>', '<branchId>', 5);
-- Positive delta increases stock; negative delta decreases stock.

CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
BEGIN
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
  SET stock = jsonb_set(stock, ARRAY[p_branch_id], to_jsonb(GREATEST(0, v_current + p_delta)), true)
  WHERE id = p_part_id;
END;
$$;
