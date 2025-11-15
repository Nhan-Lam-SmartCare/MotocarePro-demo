-- Fix work_order_create_atomic: Remove userId column from INSERT
-- Issue: work_orders table doesn't have userId column

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
  p_user_id text  -- For audit log only, not stored in work_orders
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
      v_quantity := COALESCE((v_part->>'quantity')::int, 0);
      v_price := COALESCE((v_part->>'price')::numeric, 0);

      IF v_part_id IS NULL OR v_quantity <= 0 THEN
        RAISE EXCEPTION 'INVALID_PART';
      END IF;

      -- Get current stock with row lock
      SELECT COALESCE((stock->>p_branch_id)::int, 0) INTO v_current_stock 
      FROM parts WHERE id = v_part_id FOR UPDATE;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'PART_NOT_FOUND: %', v_part_id;
      END IF;

      IF v_current_stock < v_quantity THEN
        v_insufficient := v_insufficient || jsonb_build_object(
          'partId', v_part_id,
          'partName', v_part_name,
          'requested', v_quantity,
          'available', v_current_stock
        );
        CONTINUE;
      END IF;

      -- Decrement stock
      UPDATE parts 
      SET stock = jsonb_set(stock, ARRAY[p_branch_id], to_jsonb(v_current_stock - v_quantity), true) 
      WHERE id = v_part_id;

      -- Insert inventory_transactions (Xuất kho)
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
        v_creation_date,
        public.mc_avg_cost(v_part_id, p_branch_id),
        public.mc_avg_cost(v_part_id, p_branch_id) * v_quantity,
        p_branch_id,
        'Sử dụng cho sửa chữa',
        p_order_id
      );
    END LOOP;
  END IF;

  -- Return error if insufficient stock
  IF jsonb_array_length(v_insufficient) > 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', v_insufficient::text;
  END IF;

  -- Insert work order (WITHOUT userId column)
  INSERT INTO work_orders(
    id, customerName, customerPhone, vehicleModel, licensePlate,
    issueDescription, technicianName, status, laborCost, discount,
    partsUsed, additionalServices, total, branchId, paymentStatus,
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

  -- Audit log (p_user_id is used here if needed for audit table)
  INSERT INTO audit_logs(id, action, "tableName", "recordId", "userId", details, timestamp)
  VALUES (
    gen_random_uuid()::text,
    'CREATE',
    'work_orders',
    p_order_id,
    p_user_id,
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
      'income',
      'service_deposit',
      p_deposit_amount,
      v_creation_date,
      'Đặt cọc sửa chữa ' || p_order_id,
      p_branch_id,
      p_payment_method,
      p_order_id
    );

    UPDATE work_orders 
    SET depositTransactionId = v_deposit_tx_id, depositDate = v_creation_date
    WHERE id = p_order_id;
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
      'service_payment',
      p_additional_payment,
      v_creation_date,
      'Thanh toán sửa chữa ' || p_order_id,
      p_branch_id,
      p_payment_method,
      p_order_id
    );

    UPDATE work_orders 
    SET paymentTransactionId = v_payment_tx_id, paymentDate = v_creation_date
    WHERE id = p_order_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'orderId', p_order_id);
END;
$$;

COMMENT ON FUNCTION public.work_order_create_atomic IS 'Tạo phiếu sửa chữa atomic (fixed: removed userId column)';
