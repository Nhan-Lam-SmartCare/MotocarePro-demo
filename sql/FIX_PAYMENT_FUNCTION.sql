-- =====================================================================
-- 🔥 XÓA TẤT CẢ VERSION CŨ CỦA FUNCTION
-- =====================================================================
-- Copy TOÀN BỘ và chạy trên Supabase SQL Editor
-- =====================================================================

-- Xóa TẤT CẢ versions có thể có của work_order_complete_payment
DROP FUNCTION IF EXISTS public.work_order_complete_payment(TEXT, TEXT, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.work_order_complete_payment(TEXT, NUMERIC, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.work_order_complete_payment(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.work_order_complete_payment(TEXT, NUMERIC, TEXT) CASCADE;

-- Query để tìm TẤT CẢ versions còn sót
DO $$
DECLARE
  func_rec RECORD;
BEGIN
  FOR func_rec IN 
    SELECT proname, oidvectortypes(proargtypes) as args
    FROM pg_proc 
    WHERE proname = 'work_order_complete_payment' 
      AND pronamespace = 'public'::regnamespace
  LOOP
    RAISE NOTICE 'Found old function: % with args: %', func_rec.proname, func_rec.args;
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_rec.proname || '(' || func_rec.args || ') CASCADE';
  END LOOP;
END $$;

-- =====================================================================
-- TẠO FUNCTION MỚI (ĐÚNG FORMAT)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.work_order_complete_payment(
  p_order_id TEXT,
  p_payment_method TEXT,
  p_payment_amount NUMERIC,
  p_user_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_part JSONB;
  v_part_id TEXT;
  v_part_name TEXT;
  v_quantity INT;
  v_current_stock INT;
  v_current_reserved INT;
  v_payment_tx_id TEXT;
  v_total_paid NUMERIC;
  v_remaining NUMERIC;
  v_new_status TEXT;
  v_user_branch TEXT;
  v_should_deduct_inventory BOOLEAN;
BEGIN
  -- Get user's branch
  SELECT branch_id INTO v_user_branch
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_user_branch IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- Get order
  SELECT * INTO v_order FROM work_orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.branchid IS DISTINCT FROM v_user_branch THEN
    RAISE EXCEPTION 'BRANCH_MISMATCH';
  END IF;

  -- Check if already refunded
  IF v_order.refunded = TRUE THEN
    RAISE EXCEPTION 'ORDER_REFUNDED';
  END IF;

  -- Calculate new totals
  v_total_paid := COALESCE(v_order.totalpaid, 0) + p_payment_amount;
  v_remaining := v_order.total - v_total_paid;

  -- Determine new payment status
  IF v_remaining <= 0 THEN
    v_new_status := 'paid';
    v_remaining := 0;
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  -- CHỈ TRỪ KHO NẾU: (1) Thanh toán đủ VÀ (2) Chưa trừ kho trước đó
  v_should_deduct_inventory := (v_new_status = 'paid' AND COALESCE(v_order.inventory_deducted, FALSE) = FALSE);

  -- Create payment transaction
  IF p_payment_amount > 0 AND p_payment_method IS NOT NULL THEN
    v_payment_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchid, paymentsource, reference
    )
    VALUES (
      v_payment_tx_id,
      'income',
      'service_income',
      p_payment_amount,
      NOW(),
      'Thanh toán sửa chữa ' || p_order_id,
      v_order.branchid,
      p_payment_method,
      p_order_id
    );
  END IF;

  -- Trừ kho nếu thanh toán đủ và chưa trừ
  IF v_should_deduct_inventory AND v_order.partsused IS NOT NULL THEN
    FOR v_part IN SELECT * FROM jsonb_array_elements(v_order.partsused)
    LOOP
      v_part_id := (v_part->>'partId');
      v_part_name := (v_part->>'partName');
      v_quantity := COALESCE((v_part->>'quantity')::int, 0);

      IF v_part_id IS NULL OR v_quantity <= 0 THEN
        CONTINUE;
      END IF;

      -- Get current stock and reserved
      SELECT 
        COALESCE((stock->>v_order.branchid)::int, 0),
        COALESCE((reservedstock->>v_order.branchid)::int, 0)
      INTO v_current_stock, v_current_reserved
      FROM parts WHERE id = v_part_id FOR UPDATE;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      -- Giảm reserved
      UPDATE parts
      SET reservedstock = jsonb_set(
        COALESCE(reservedstock, '{}'::jsonb),
        ARRAY[v_order.branchid],
        to_jsonb(GREATEST(0, v_current_reserved - v_quantity))
      )
      WHERE id = v_part_id;

      -- Giảm stock
      UPDATE parts
      SET stock = jsonb_set(
        stock,
        ARRAY[v_order.branchid],
        to_jsonb(GREATEST(0, v_current_stock - v_quantity))
      )
      WHERE id = v_part_id;

      -- Tạo inventory transaction
      INSERT INTO inventory_transactions(
        id, type, "partId", "partName", quantity, date, "unitPrice", "totalPrice",
        "branchId", notes, "workOrderId"
      )
      VALUES (
        gen_random_uuid()::text,
        'Xuất kho',
        v_part_id,
        v_part_name,
        v_quantity,
        NOW(),
        COALESCE((v_part->>'price')::numeric, 0),
        COALESCE((v_part->>'price')::numeric, 0) * v_quantity,
        v_order.branchid,
        'Xuất kho khi thanh toán phiếu ' || p_order_id,
        p_order_id
      );
    END LOOP;
  END IF;

  -- Update work order
  UPDATE work_orders
  SET
    paymentstatus = v_new_status,
    totalpaid = v_total_paid,
    remainingamount = v_remaining,
    additionalpayment = COALESCE(additionalpayment, 0) + p_payment_amount,
    cashtransactionid = COALESCE(v_payment_tx_id, cashtransactionid),
    paymentdate = CASE WHEN v_payment_tx_id IS NOT NULL THEN NOW() ELSE paymentdate END,
    paymentmethod = COALESCE(p_payment_method, paymentmethod),
    inventory_deducted = CASE WHEN v_should_deduct_inventory THEN TRUE ELSE inventory_deducted END
  WHERE id = p_order_id;

  -- ✅ RETURN ĐÚNG FORMAT
  RETURN jsonb_build_object(
    'success', true,
    'orderId', p_order_id,
    'paymentStatus', v_new_status,
    'totalPaid', v_total_paid,
    'remainingAmount', v_remaining,
    'inventoryDeducted', v_should_deduct_inventory,
    'paymentTransactionId', v_payment_tx_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.work_order_complete_payment TO authenticated;

SELECT 'Function work_order_complete_payment created successfully!' AS result;
