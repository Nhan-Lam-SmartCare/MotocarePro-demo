-- =============================================================================
-- MIGRATION TỔNG HỢP: Sửa lỗi phiếu sửa chữa
-- =============================================================================
-- Date: 2025-12-06
-- Purpose: 
--   1. Fix currentKm không được lưu
--   2. Thêm vehicleId vào work_orders
--   3. Cập nhật work_order_create_atomic
--   4. Cập nhật work_order_update_atomic
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: DROP EXISTING FUNCTIONS
-- =============================================================================

DROP FUNCTION IF EXISTS public.work_order_create_atomic;
DROP FUNCTION IF EXISTS public.work_order_update_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, JSONB, JSONB, NUMERIC, TEXT, TEXT, NUMERIC, NUMERIC, TEXT);

-- =============================================================================
-- PART 2: CREATE work_order_create_atomic WITH currentKm
-- =============================================================================

CREATE OR REPLACE FUNCTION public.work_order_create_atomic(
  p_order_id TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_vehicle_model TEXT,
  p_license_plate TEXT,
  p_issue_description TEXT,
  p_technician_name TEXT,
  p_status TEXT,
  p_labor_cost NUMERIC,
  p_discount NUMERIC,
  p_parts_used JSONB,
  p_additional_services JSONB,
  p_total NUMERIC,
  p_branch_id TEXT,
  p_payment_status TEXT,
  p_payment_method TEXT,
  p_deposit_amount NUMERIC,
  p_additional_payment NUMERIC,
  p_user_id TEXT,
  p_vehicle_id TEXT DEFAULT NULL,
  p_current_km INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_part JSONB;
  v_index INT := 0;
  v_parts_count INT := COALESCE(jsonb_array_length(p_parts_used), 0);
  v_part_id TEXT;
  v_part_name TEXT;
  v_quantity INT;
  v_current_stock INT;
  v_current_reserved INT;
  v_available INT;
  v_deposit_tx_id TEXT;
  v_payment_tx_id TEXT;
  v_warnings JSONB := '[]'::jsonb;
  v_creation_date TIMESTAMP := NOW();
  v_user_branch TEXT;
BEGIN
  SELECT branch_id INTO v_user_branch FROM public.profiles WHERE id = auth.uid();
  
  IF v_user_branch IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User has no branch assigned';
  END IF;
  
  IF p_branch_id IS DISTINCT FROM v_user_branch THEN
    RAISE EXCEPTION 'BRANCH_MISMATCH: Cannot create work order for different branch';
  END IF;

  IF p_payment_status NOT IN ('unpaid', 'paid', 'partial') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS: Must be unpaid, paid, or partial';
  END IF;

  -- Reserve stock for each part
  IF v_parts_count > 0 THEN
    WHILE v_index < v_parts_count LOOP
      v_part := p_parts_used->v_index;
      v_part_id := v_part->>'partId';
      v_part_name := v_part->>'partName';
      v_quantity := COALESCE((v_part->>'quantity')::INT, 0);

      IF v_quantity > 0 THEN
        SELECT 
          COALESCE((stock->>p_branch_id)::INT, 0),
          COALESCE((reserved->>p_branch_id)::INT, 0)
        INTO v_current_stock, v_current_reserved
        FROM parts WHERE id = v_part_id;

        v_available := v_current_stock - v_current_reserved;

        IF v_available < v_quantity THEN
          v_warnings := v_warnings || jsonb_build_object(
            'partId', v_part_id,
            'partName', v_part_name,
            'requested', v_quantity,
            'available', v_available
          );
        END IF;

        UPDATE parts
        SET reserved = jsonb_set(
          COALESCE(reserved, '{}'::jsonb),
          ARRAY[p_branch_id],
          to_jsonb(COALESCE((reserved->>p_branch_id)::INT, 0) + v_quantity)
        )
        WHERE id = v_part_id;
      END IF;

      v_index := v_index + 1;
    END LOOP;
  END IF;

  -- Insert work order with currentKm
  INSERT INTO work_orders(
    id, customerName, customerPhone, vehicleId, vehicleModel, licensePlate,
    currentKm, issueDescription, technicianName, status, laborCost, discount,
    partsUsed, additionalServices, total, branchId, paymentStatus,
    paymentMethod, depositAmount, additionalPayment, totalPaid,
    remainingAmount, creationDate
  )
  VALUES (
    p_order_id, p_customer_name, p_customer_phone, p_vehicle_id, p_vehicle_model, p_license_plate,
    p_current_km, p_issue_description, p_technician_name, p_status, p_labor_cost, p_discount,
    p_parts_used, p_additional_services, p_total, p_branch_id, p_payment_status,
    p_payment_method, 
    CASE WHEN p_deposit_amount > 0 THEN p_deposit_amount ELSE NULL END,
    CASE WHEN p_additional_payment > 0 THEN p_additional_payment ELSE NULL END,
    COALESCE(p_deposit_amount, 0) + COALESCE(p_additional_payment, 0),
    p_total - (COALESCE(p_deposit_amount, 0) + COALESCE(p_additional_payment, 0)),
    v_creation_date
  );

  -- Create deposit transaction
  IF p_deposit_amount > 0 AND p_payment_method IS NOT NULL THEN
    v_deposit_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_deposit_tx_id, 'income', 'service_deposit', p_deposit_amount, v_creation_date,
      'Đặt cọc sửa chữa ' || p_order_id, p_branch_id, p_payment_method, p_order_id
    );

    UPDATE work_orders 
    SET depositTransactionId = v_deposit_tx_id, depositDate = v_creation_date
    WHERE id = p_order_id;
  END IF;

  -- Create payment transaction
  IF p_additional_payment > 0 AND p_payment_method IS NOT NULL THEN
    v_payment_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_payment_tx_id, 'income', 'service_income', p_additional_payment, v_creation_date,
      'Thu tiền sửa chữa ' || p_order_id, p_branch_id, p_payment_method, p_order_id
    );

    UPDATE work_orders 
    SET cashTransactionId = v_payment_tx_id, paymentDate = v_creation_date
    WHERE id = p_order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'orderId', p_order_id,
    'depositTransactionId', v_deposit_tx_id,
    'paymentTransactionId', v_payment_tx_id,
    'warnings', v_warnings
  );
END;
$$;

-- =============================================================================
-- PART 3: CREATE work_order_update_atomic WITH currentKm
-- =============================================================================

CREATE OR REPLACE FUNCTION public.work_order_update_atomic(
  p_order_id TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_vehicle_model TEXT,
  p_license_plate TEXT,
  p_issue_description TEXT,
  p_technician_name TEXT,
  p_status TEXT,
  p_labor_cost NUMERIC,
  p_discount NUMERIC,
  p_parts_used JSONB,
  p_additional_services JSONB,
  p_total NUMERIC,
  p_payment_status TEXT,
  p_payment_method TEXT,
  p_deposit_amount NUMERIC,
  p_additional_payment NUMERIC,
  p_user_id TEXT,
  p_vehicle_id TEXT DEFAULT NULL,
  p_current_km INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_parts JSONB;
  v_new_part JSONB;
  v_old_part JSONB;
  v_part_id TEXT;
  v_part_name TEXT;
  v_quantity INT;
  v_old_quantity INT;
  v_quantity_diff INT;
  v_current_stock INT;
  v_current_reserved INT;
  v_available INT;
  v_order_row JSONB;
  v_branch_id TEXT;
  v_deposit_tx_id TEXT;
  v_payment_tx_id TEXT;
  v_old_deposit NUMERIC;
  v_old_additional NUMERIC;
  v_warnings JSONB := '[]'::jsonb;
  v_index INT := 0;
  v_parts_count INT := COALESCE(jsonb_array_length(p_parts_used), 0);
  v_user_branch TEXT;
BEGIN
  SELECT branch_id INTO v_user_branch FROM public.profiles WHERE id = auth.uid();
  
  IF v_user_branch IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User has no branch assigned';
  END IF;

  SELECT partsUsed, branchId, depositAmount, additionalPayment
  INTO v_old_parts, v_branch_id, v_old_deposit, v_old_additional
  FROM work_orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_branch_id IS DISTINCT FROM v_user_branch THEN
    RAISE EXCEPTION 'BRANCH_MISMATCH';
  END IF;

  IF p_status NOT IN ('Tiếp nhận', 'Đang sửa', 'Đã sửa xong', 'Trả máy') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  IF p_payment_status NOT IN ('unpaid', 'paid', 'partial') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';
  END IF;

  -- Release reserved for removed/reduced parts
  FOR v_old_part IN SELECT * FROM jsonb_array_elements(COALESCE(v_old_parts, '[]'::jsonb))
  LOOP
    v_part_id := (v_old_part->>'partId');
    v_old_quantity := COALESCE((v_old_part->>'quantity')::int, 0);
    
    v_new_part := NULL;
    FOR v_index IN 0..(v_parts_count - 1) LOOP
      IF (p_parts_used->v_index->>'partId') = v_part_id THEN
        v_new_part := p_parts_used->v_index;
        EXIT;
      END IF;
    END LOOP;

    IF v_new_part IS NULL THEN
      v_quantity_diff := v_old_quantity;
    ELSE
      v_quantity := COALESCE((v_new_part->>'quantity')::int, 0);
      v_quantity_diff := v_old_quantity - v_quantity;
    END IF;

    IF v_quantity_diff > 0 THEN
      SELECT COALESCE((reserved->>v_branch_id)::int, 0) INTO v_current_reserved
      FROM parts WHERE id = v_part_id FOR UPDATE;

      UPDATE parts
      SET reserved = jsonb_set(
        COALESCE(reserved, '{}'::jsonb),
        ARRAY[v_branch_id],
        to_jsonb(GREATEST(0, v_current_reserved - v_quantity_diff))
      )
      WHERE id = v_part_id;
    END IF;
  END LOOP;

  -- Reserve more for new/increased parts
  FOR v_index IN 0..(v_parts_count - 1) LOOP
    v_new_part := p_parts_used->v_index;
    v_part_id := (v_new_part->>'partId');
    v_part_name := (v_new_part->>'partName');
    v_quantity := COALESCE((v_new_part->>'quantity')::int, 0);

    IF v_part_id IS NULL OR v_quantity <= 0 THEN
      CONTINUE;
    END IF;

    v_old_quantity := 0;
    FOR v_old_part IN SELECT * FROM jsonb_array_elements(COALESCE(v_old_parts, '[]'::jsonb))
    LOOP
      IF (v_old_part->>'partId') = v_part_id THEN
        v_old_quantity := COALESCE((v_old_part->>'quantity')::int, 0);
        EXIT;
      END IF;
    END LOOP;

    v_quantity_diff := v_quantity - v_old_quantity;

    IF v_quantity_diff > 0 THEN
      SELECT 
        COALESCE((stock->>v_branch_id)::int, 0),
        COALESCE((reserved->>v_branch_id)::int, 0)
      INTO v_current_stock, v_current_reserved
      FROM parts WHERE id = v_part_id FOR UPDATE;

      v_available := v_current_stock - v_current_reserved;

      IF v_available < v_quantity_diff THEN
        v_warnings := v_warnings || jsonb_build_object(
          'partId', v_part_id,
          'partName', v_part_name,
          'requested', v_quantity_diff,
          'available', v_available,
          'message', 'Tồn kho không đủ: ' || v_part_name
        );
      END IF;

      UPDATE parts
      SET reserved = jsonb_set(
        COALESCE(reserved, '{}'::jsonb),
        ARRAY[v_branch_id],
        to_jsonb(v_current_reserved + v_quantity_diff)
      )
      WHERE id = v_part_id;
    END IF;
  END LOOP;

  -- Handle payment changes
  IF p_deposit_amount > COALESCE(v_old_deposit, 0) AND p_payment_method IS NOT NULL THEN
    v_deposit_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_deposit_tx_id, 'income', 'service_deposit',
      p_deposit_amount - COALESCE(v_old_deposit, 0), NOW(),
      'Đặt cọc bổ sung ' || p_order_id, v_branch_id, p_payment_method, p_order_id
    );
  END IF;

  IF p_additional_payment > COALESCE(v_old_additional, 0) AND p_payment_method IS NOT NULL THEN
    v_payment_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(
      id, type, category, amount, date, description, branchId, paymentSource, reference
    )
    VALUES (
      v_payment_tx_id, 'income', 'service_income',
      p_additional_payment - COALESCE(v_old_additional, 0), NOW(),
      'Thu tiền bổ sung ' || p_order_id, v_branch_id, p_payment_method, p_order_id
    );
  END IF;

  -- Update work order with currentKm
  UPDATE work_orders
  SET
    customerName = p_customer_name,
    customerPhone = p_customer_phone,
    vehicleId = COALESCE(p_vehicle_id, vehicleId),
    vehicleModel = p_vehicle_model,
    licensePlate = p_license_plate,
    currentKm = COALESCE(p_current_km, currentKm),
    issueDescription = p_issue_description,
    technicianName = p_technician_name,
    status = p_status,
    laborCost = p_labor_cost,
    discount = p_discount,
    partsUsed = p_parts_used,
    additionalServices = p_additional_services,
    total = p_total,
    paymentStatus = p_payment_status,
    paymentMethod = p_payment_method,
    depositAmount = CASE WHEN p_deposit_amount > 0 THEN p_deposit_amount ELSE depositAmount END,
    additionalPayment = CASE WHEN p_additional_payment > 0 THEN p_additional_payment ELSE additionalPayment END,
    totalPaid = COALESCE(p_deposit_amount, depositAmount, 0) + COALESCE(p_additional_payment, additionalPayment, 0),
    remainingAmount = p_total - (COALESCE(p_deposit_amount, depositAmount, 0) + COALESCE(p_additional_payment, additionalPayment, 0)),
    depositTransactionId = COALESCE(v_deposit_tx_id, depositTransactionId),
    cashTransactionId = COALESCE(v_payment_tx_id, cashTransactionId),
    depositDate = CASE WHEN v_deposit_tx_id IS NOT NULL THEN NOW() ELSE depositDate END,
    paymentDate = CASE WHEN v_payment_tx_id IS NOT NULL THEN NOW() ELSE paymentDate END
  WHERE id = p_order_id;

  SELECT jsonb_build_object(
    'workOrder', to_jsonb(w.*),
    'depositTransactionId', v_deposit_tx_id,
    'paymentTransactionId', v_payment_tx_id,
    'stockWarnings', v_warnings
  ) INTO v_order_row
  FROM work_orders w WHERE w.id = p_order_id;

  RETURN v_order_row;
END;
$$;

-- =============================================================================
-- PART 4: GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.work_order_create_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.work_order_update_atomic TO authenticated;

-- =============================================================================
-- PART 5: ADD COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.work_order_create_atomic IS 'Tạo phiếu sửa chữa với currentKm - CHỈ đặt trước tồn kho (reserve), KHÔNG trừ kho thực';
COMMENT ON FUNCTION public.work_order_update_atomic IS 'Cập nhật phiếu sửa chữa với currentKm - điều chỉnh reserved stock';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Kiểm tra function CREATE đã có p_current_km
SELECT 
  p.specific_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
  AND p.specific_name LIKE 'work_order_create_atomic%'
  AND p.parameter_name IN ('p_current_km', 'p_vehicle_id')
ORDER BY p.ordinal_position;

-- Kiểm tra function UPDATE đã có p_current_km
SELECT 
  p.specific_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
  AND p.specific_name LIKE 'work_order_update_atomic%'
  AND p.parameter_name IN ('p_current_km', 'p_vehicle_id')
ORDER BY p.ordinal_position;

-- Nếu thấy p_current_km và p_vehicle_id trong danh sách => THÀNH CÔNG ✅
