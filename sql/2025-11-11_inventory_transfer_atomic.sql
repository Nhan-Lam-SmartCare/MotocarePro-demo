-- Atomic inventory transfer between branches
-- Moves quantity from source branch to destination via two inventory_transactions rows
-- Enforces sufficient stock at source using row lock

CREATE OR REPLACE FUNCTION public.inventory_transfer_atomic(
  p_part_id TEXT,
  p_part_name TEXT,
  p_quantity INT,
  p_from_branch TEXT,
  p_to_branch TEXT,
  p_notes TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;
  IF p_from_branch = p_to_branch THEN
    RAISE EXCEPTION 'INVALID_BRANCHES';
  END IF;
  -- Lock source part
  SELECT COALESCE((stock->>p_from_branch)::int,0) INTO v_current FROM public.parts WHERE id = p_part_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PART_NOT_FOUND'; END IF;
  IF v_current < p_quantity THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK'; END IF;

  -- Create export from source
  INSERT INTO public.inventory_transactions(id, type, partId, partName, quantity, date, unitPrice, totalPrice, branchId, notes)
  VALUES (gen_random_uuid()::text, 'Xuất kho', p_part_id, p_part_name, p_quantity, NOW(), NULL, NULL, p_from_branch, COALESCE(p_notes,'Chuyển kho ra'));

  -- Create import to destination
  INSERT INTO public.inventory_transactions(id, type, partId, partName, quantity, date, unitPrice, totalPrice, branchId, notes)
  VALUES (gen_random_uuid()::text, 'Nhập kho', p_part_id, p_part_name, p_quantity, NOW(), NULL, NULL, p_to_branch, COALESCE(p_notes,'Chuyển kho vào'));
END;
$$;
