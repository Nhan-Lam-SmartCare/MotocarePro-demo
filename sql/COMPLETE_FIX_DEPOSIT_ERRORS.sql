-- ============================================
-- FIX TẤT CẢ CÁC LỖI KHI TẠO PHIẾU CÓ ĐẶT CỌC
-- ============================================

-- Fix 1: Thêm column additionalServices vào work_orders
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS "additionalServices" JSONB DEFAULT '[]'::jsonb;

-- Fix 2: Sửa work_order_create_atomic với column names đúng
CREATE OR REPLACE FUNCTION public.work_order_create_atomic(
  p_order_id text,
  p_customer_name text,
  p_customer_phone text,
  p_vehicle_model text,
  p_license_plate text,
  p_issue_description text,
  p_technician_name text,
  p_status text,
  p_labor_cost numeric,
  p_discount numeric,
  p_parts_used jsonb,
  p_additional_services jsonb,
  p_total numeric,
  p_branch_id text,
  p_payment_status text,
  p_payment_method text,
  p_deposit_amount numeric,
  p_additional_payment numeric,
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parts_count int;
  v_index int;
  v_part jsonb;
  v_part_id text;
  v_part_name text;
  v_quantity int;
  v_price numeric;
  v_current_stock int;
  v_insufficient jsonb := '[]'::jsonb;
  v_creation_date timestamptz := NOW();
  v_deposit_tx_id text;
  v_payment_tx_id text;
BEGIN
  -- Stock validation
  v_parts_count := jsonb_array_length(COALESCE(p_parts_used, '[]'::jsonb));
  
  IF v_parts_count > 0 THEN
    FOR v_index IN 0..(v_parts_count - 1) LOOP
      v_part := p_parts_used->v_index;
      v_part_id := (v_part->>'partId');
      v_part_name := (v_part->>'partName');
      v_quantity := (v_part->>'quantity')::int;

      SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
      FROM inventory_transactions
      WHERE "partId" = v_part_id AND "branchId" = p_branch_id;

      IF v_current_stock < v_quantity THEN
        v_insufficient := v_insufficient || jsonb_build_object(
          'partId', v_part_id,
          'partName', v_part_name,
          'required', v_quantity,
          'available', v_current_stock
        );
      END IF;
    END LOOP;
  END IF;

  -- Return error if insufficient stock
  IF jsonb_array_length(v_insufficient) > 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', v_insufficient::text;
  END IF;

  -- Deduct stock
  IF v_parts_count > 0 THEN
    FOR v_index IN 0..(v_parts_count - 1) LOOP
      v_part := p_parts_used->v_index;
      v_part_id := (v_part->>'partId');
      v_part_name := (v_part->>'partName');
      v_quantity := (v_part->>'quantity')::int;
      v_price := (v_part->>'price')::numeric;

      INSERT INTO inventory_transactions(
        id, "partId", "partName", quantity, date, cost, total, "branchId", notes, reference
      )
      VALUES (
        gen_random_uuid()::text,
        v_part_id,
        v_part_name,
        -v_quantity,
        v_creation_date,
        public.mc_avg_cost(v_part_id, p_branch_id),
        -public.mc_avg_cost(v_part_id, p_branch_id) * v_quantity,
        p_branch_id,
        'Sử dụng cho sửa chữa',
        p_order_id
      );
    END LOOP;
  END IF;

  -- Insert work order (with additionalServices column)
  INSERT INTO work_orders(
    id, customerName, customerPhone, vehicleModel, licensePlate,
    issueDescription, technicianName, status, laborCost, discount,
    partsUsed, "additionalServices", total, branchId, paymentStatus,
    paymentMethod, depositAmount, additionalPayment, totalPaid,
    remainingAmount, creationDate
  )
  VALUES (
    p_order_id, p_customer_name, p_customer_phone, p_vehicle_model, p_license_plate,
    p_issue_description, p_technician_name, p_status, p_labor_cost, p_discount,
    p_parts_used, p_additional_services, p_total, p_branch_id, p_payment_status,
    p_payment_method, 
    CASE WHEN p_deposit_amount > 0 THEN p_deposit_amount ELSE NULL END,
    CASE WHEN p_additional_payment > 0 THEN p_additional_payment ELSE NULL END,
    COALESCE(p_deposit_amount, 0) + COALESCE(p_additional_payment, 0),
    p_total - (COALESCE(p_deposit_amount, 0) + COALESCE(p_additional_payment, 0)),
    v_creation_date
  );

  -- ✅ FIX: Use snake_case column names (table_name, record_id, user_id)
  INSERT INTO audit_logs(id, action, table_name, record_id, user_id, old_data, created_at)
  VALUES (
    gen_random_uuid(),
    'CREATE',
    'work_orders',
    p_order_id,
    CASE WHEN p_user_id IS NOT NULL AND p_user_id != '' THEN p_user_id::uuid ELSE NULL END,
    jsonb_build_object(
      'order_id', p_order_id,
      'customer', p_customer_name,
      'total', p_total,
      'status', p_status
    ),
    v_creation_date
  );

  -- Create deposit transaction if applicable
  IF p_deposit_amount > 0 AND p_payment_method IS NOT NULL THEN
    v_deposit_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_deposit_tx_id,
      'deposit',
      'service_deposit',
      p_deposit_amount,
      v_creation_date,
      'Đặt cọc sửa chữa #' || p_order_id,
      p_branch_id,
      p_payment_method,
      p_order_id
    );
  END IF;

  -- Create payment transaction if applicable
  IF p_additional_payment > 0 AND p_payment_method IS NOT NULL THEN
    v_payment_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_payment_tx_id,
      'income',
      'service_income',
      p_additional_payment,
      v_creation_date,
      'Thu tiền sửa chữa #' || p_order_id,
      p_branch_id,
      p_payment_method,
      p_order_id
    );
  END IF;

  -- Return transaction IDs
  RETURN jsonb_build_object(
    'success', true,
    'orderId', p_order_id,
    'depositTransactionId', v_deposit_tx_id,
    'paymentTransactionId', v_payment_tx_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating work order: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.work_order_create_atomic IS 'Tạo phiếu sửa chữa atomic - Fixed all column names';
GRANT EXECUTE ON FUNCTION public.work_order_create_atomic TO anon, authenticated;

-- Verify
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'work_orders'
  AND column_name = 'additionalServices';

SELECT 
  column_name
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
