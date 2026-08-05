/**
 * Fix 6 lỗi còn lại sau migration:
 * 1. Drop all overloads của work_order_update_atomic và work_order_complete_payment
 * 2. Apply version mới nhất dùng reservedstock (không phải reserved)
 * 3. Re-run B1 để drop cột reserved cũ
 * 
 * Usage: node scripts/fix_remaining_migration_errors.mjs YOUR_TOKEN
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const PERSONAL_ACCESS_TOKEN = process.argv[2];

if (!PERSONAL_ACCESS_TOKEN) {
  console.error('❌ Usage: node scripts/fix_remaining_migration_errors.mjs YOUR_TOKEN');
  process.exit(1);
}

async function runSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${NEW_PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.message || JSON.stringify(data) };
  }
  return { ok: true, data };
}

// ============================================================
// FIX 1: Drop tất cả overloads của các hàm bị lỗi
// ============================================================
const DROP_ALL_OVERLOADS = `
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop tất cả overloads của work_order_update_atomic
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'work_order_update_atomic'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.work_order_update_atomic(' || r.args || ') CASCADE';
    RAISE NOTICE 'Dropped: work_order_update_atomic(%)', r.args;
  END LOOP;

  -- Drop tất cả overloads của work_order_complete_payment
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'work_order_complete_payment'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.work_order_complete_payment(' || r.args || ') CASCADE';
    RAISE NOTICE 'Dropped: work_order_complete_payment(%)', r.args;
  END LOOP;
END $$;
`;

// ============================================================
// FIX 2: work_order_update_atomic - phiên bản ĐÚNG (reservedstock)
// ============================================================
const CREATE_WORK_ORDER_UPDATE_ATOMIC = `
CREATE OR REPLACE FUNCTION public.work_order_update_atomic(
  p_order_id text,
  p_customer_name text,
  p_customer_phone text,
  p_vehicle_model text,
  p_license_plate text,
  p_vehicle_id text DEFAULT NULL,
  p_current_km integer DEFAULT NULL,
  p_issue_description text DEFAULT '',
  p_technician_name text DEFAULT '',
  p_status text DEFAULT 'Tiếp nhận',
  p_labor_cost numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_parts_used jsonb DEFAULT '[]'::jsonb,
  p_additional_services jsonb DEFAULT NULL,
  p_total numeric DEFAULT 0,
  p_payment_status text DEFAULT 'unpaid',
  p_payment_method text DEFAULT NULL,
  p_deposit_amount numeric DEFAULT 0,
  p_additional_payment numeric DEFAULT 0,
  p_user_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  v_branch_id TEXT;
  v_deposit_tx_id TEXT;
  v_payment_tx_id TEXT;
  v_old_deposit NUMERIC;
  v_old_additional NUMERIC;
  v_old_cash_tx_id TEXT;
  v_warnings JSONB := '[]'::jsonb;
  v_index INT := 0;
  v_parts_count INT := COALESCE(jsonb_array_length(p_parts_used), 0);
  v_user_branch TEXT;
  v_error_msg TEXT;
BEGIN
  SELECT branch_id INTO v_user_branch FROM public.profiles WHERE id = auth.uid();
  IF v_user_branch IS NULL THEN
    SELECT branchId INTO v_branch_id FROM work_orders WHERE id = p_order_id;
    IF v_branch_id IS NULL THEN
      RAISE EXCEPTION 'UNAUTHORIZED: User has no branch assigned and order not found';
    END IF;
    v_user_branch := v_branch_id;
  END IF;

  SELECT partsUsed, branchId, depositAmount, additionalPayment, cashTransactionId
  INTO v_old_parts, v_branch_id, v_old_deposit, v_old_additional, v_old_cash_tx_id
  FROM work_orders WHERE id = p_order_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND: %', p_order_id; END IF;
  IF v_branch_id IS DISTINCT FROM v_user_branch THEN
    RAISE EXCEPTION 'BRANCH_MISMATCH: User branch % does not match order branch %', v_user_branch, v_branch_id;
  END IF;
  IF p_status NOT IN ('Tiếp nhận', 'Đang sửa', 'Đã sửa xong', 'Trả máy') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;
  IF p_payment_status NOT IN ('unpaid', 'paid', 'partial') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';
  END IF;

  -- Release reservedstock for removed/reduced parts
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
      SELECT COALESCE((reservedstock->>v_branch_id)::int, 0) INTO v_current_reserved
      FROM parts WHERE id = v_part_id FOR UPDATE;
      UPDATE parts
      SET reservedstock = jsonb_set(
        COALESCE(reservedstock, '{}'::jsonb),
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
    IF v_part_id IS NULL OR v_quantity <= 0 THEN CONTINUE; END IF;
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
        COALESCE((reservedstock->>v_branch_id)::int, 0)
      INTO v_current_stock, v_current_reserved
      FROM parts WHERE id = v_part_id FOR UPDATE;
      v_available := v_current_stock - v_current_reserved;
      IF v_available < v_quantity_diff THEN
        v_warnings := v_warnings || jsonb_build_object(
          'partId', v_part_id, 'partName', v_part_name,
          'requested', v_quantity_diff, 'available', v_available,
          'message', 'Tồn kho không đủ: ' || v_part_name
        );
      END IF;
      UPDATE parts
      SET reservedstock = jsonb_set(
        COALESCE(reservedstock, '{}'::jsonb),
        ARRAY[v_branch_id],
        to_jsonb(v_current_reserved + v_quantity_diff)
      )
      WHERE id = v_part_id;
    END IF;
  END LOOP;

  -- Handle payment
  IF p_deposit_amount > COALESCE(v_old_deposit, 0) AND p_payment_method IS NOT NULL THEN
    v_deposit_tx_id := gen_random_uuid()::text;
    INSERT INTO cash_transactions(id, type, category, amount, date, description, branchId, paymentSource, reference)
    VALUES (v_deposit_tx_id, 'income', 'service_deposit',
            p_deposit_amount - COALESCE(v_old_deposit, 0), NOW(),
            'Đặt cọc bổ sung ' || p_order_id, v_branch_id, p_payment_method, p_order_id);
  END IF;
  IF p_additional_payment > 0 AND p_payment_method IS NOT NULL THEN
    IF p_additional_payment > COALESCE(v_old_additional, 0)
       OR (COALESCE(v_old_additional, 0) > 0 AND v_old_cash_tx_id IS NULL) THEN
      v_payment_tx_id := gen_random_uuid()::text;
      INSERT INTO cash_transactions(id, type, category, amount, date, description, branchId, paymentSource, reference)
      VALUES (v_payment_tx_id, 'income', 'service_income',
              CASE WHEN p_additional_payment > COALESCE(v_old_additional, 0)
                   THEN p_additional_payment - COALESCE(v_old_additional, 0)
                   ELSE p_additional_payment END,
              NOW(),
              CASE WHEN p_additional_payment > COALESCE(v_old_additional, 0)
                   THEN 'Thu tiền bổ sung ' || p_order_id
                   ELSE 'Thu tiền sửa chữa ' || p_order_id END,
              v_branch_id, p_payment_method, p_order_id);
    END IF;
  END IF;

  UPDATE work_orders SET
    customerName = COALESCE(p_customer_name, customerName),
    customerPhone = COALESCE(p_customer_phone, customerPhone),
    vehicleModel = COALESCE(p_vehicle_model, vehicleModel),
    licensePlate = COALESCE(p_license_plate, licensePlate),
    vehicleId = COALESCE(p_vehicle_id, vehicleId),
    currentKm = COALESCE(p_current_km, currentKm),
    issueDescription = COALESCE(p_issue_description, issueDescription),
    technicianName = COALESCE(p_technician_name, technicianName),
    status = COALESCE(p_status, status),
    laborCost = COALESCE(p_labor_cost, laborCost),
    discount = COALESCE(p_discount, discount),
    partsUsed = COALESCE(p_parts_used, partsUsed),
    additionalServices = p_additional_services,
    total = COALESCE(p_total, total),
    paymentStatus = COALESCE(p_payment_status, paymentStatus),
    paymentMethod = COALESCE(p_payment_method, paymentMethod),
    depositAmount = CASE WHEN p_deposit_amount > 0 THEN p_deposit_amount ELSE depositAmount END,
    additionalPayment = CASE WHEN p_additional_payment > 0 THEN p_additional_payment ELSE additionalPayment END,
    totalPaid = COALESCE(p_deposit_amount, depositAmount, 0) + COALESCE(p_additional_payment, additionalPayment, 0),
    remainingAmount = COALESCE(p_total, total) - (COALESCE(p_deposit_amount, depositAmount, 0) + COALESCE(p_additional_payment, additionalPayment, 0)),
    depositTransactionId = COALESCE(v_deposit_tx_id, depositTransactionId),
    cashTransactionId = COALESCE(v_payment_tx_id, cashTransactionId),
    depositDate = CASE WHEN v_deposit_tx_id IS NOT NULL THEN NOW() ELSE depositDate END,
    paymentDate = CASE WHEN v_payment_tx_id IS NOT NULL THEN NOW() ELSE paymentDate END
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'workOrder', (SELECT row_to_json(work_orders.*) FROM work_orders WHERE id = p_order_id),
    'depositTransactionId', v_deposit_tx_id,
    'paymentTransactionId', v_payment_tx_id,
    'stockWarnings', v_warnings
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
  RAISE EXCEPTION 'work_order_update_atomic error: %', v_error_msg;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.work_order_update_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.work_order_update_atomic TO anon;
GRANT EXECUTE ON FUNCTION public.work_order_update_atomic TO service_role;
COMMENT ON FUNCTION public.work_order_update_atomic IS 'v2026-08-05 - Fixed to use reservedstock';
`;

// ============================================================
// FIX 3: Re-run B1 (drop reserved column)
// ============================================================
const B1_SQL = fs.readFileSync(
  path.join(__dirname, '..', 'sql', '2026-07-09_B1_consolidate_reserved_column.sql'),
  'utf8'
);

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🔧 Fixing 6 remaining migration errors...\n');

  console.log('Step 1: Drop all function overloads...');
  const r1 = await runSQL(DROP_ALL_OVERLOADS, 'drop overloads');
  console.log(r1.ok ? '  ✅ Done' : `  ❌ ${r1.error}`);

  await new Promise(r => setTimeout(r, 500));

  console.log('Step 2: Apply work_order_update_atomic (reservedstock)...');
  const r2 = await runSQL(CREATE_WORK_ORDER_UPDATE_ATOMIC, 'create update atomic');
  console.log(r2.ok ? '  ✅ Done' : `  ❌ ${r2.error?.substring(0, 200)}`);

  await new Promise(r => setTimeout(r, 500));

  console.log('Step 3: Run B1 - drop reserved column...');
  const r3 = await runSQL(B1_SQL, 'B1');
  console.log(r3.ok ? '  ✅ Done' : `  ⚠️  ${r3.error?.substring(0, 200)}`);

  await new Promise(r => setTimeout(r, 500));

  // Re-apply latest work_order_complete_payment from its file
  console.log('Step 4: Re-apply work_order_complete_payment (idempotent)...');
  const completeSql = fs.readFileSync(
    path.join(__dirname, '..', 'sql', '2026-03-23_work_order_complete_payment_idempotent.sql'),
    'utf8'
  );
  const r4 = await runSQL(completeSql, 'complete payment');
  console.log(r4.ok ? '  ✅ Done' : `  ❌ ${r4.error?.substring(0, 200)}`);

  console.log('\n✅ All fixes applied!');
  console.log('\n📌 Next steps:');
  console.log('   1. Vào Supabase Dashboard → Authentication → Users');
  console.log('   2. Tạo user với email + password của bạn');
  console.log('   3. Vào Database → profiles table → thêm role owner cho user đó');
  console.log('   4. Test đăng nhập vào app');
}

main().catch(console.error);
