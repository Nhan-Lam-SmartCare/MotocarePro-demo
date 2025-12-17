-- =====================================================================
-- KIỂM TRA NHANH HỆ THỐNG PHIẾU SỬA CHỮA
-- =====================================================================

-- 1. Cấu trúc bảng
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'work_orders'
  AND column_name IN ('vehicleid', 'currentkm', 'inventory_deducted')
ORDER BY column_name;

-- 2. Phiếu PAID chưa trừ kho (QUAN TRỌNG)
SELECT 
  COUNT(*) as so_phieu_loi,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Không có phiếu lỗi'
    ELSE 'LỖI - Có ' || COUNT(*) || ' phiếu paid chưa trừ kho'
  END as trang_thai
FROM work_orders
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0;

-- 3. Danh sách 10 phiếu mới nhất
SELECT 
  SUBSTRING(id FROM 4) as ma_phieu,
  customername as khach_hang,
  DATE(creationdate) as ngay,
  paymentstatus as trang_thai_TT,
  total as tong_tien,
  COALESCE(inventory_deducted, FALSE) as da_tru_kho,
  CASE 
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = TRUE THEN 'OK'
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = FALSE THEN 'LOI - Paid chua tru kho'
    WHEN paymentstatus = 'unpaid' THEN 'Chua thanh toan'
    ELSE 'Khac'
  END as ket_luan
FROM work_orders
WHERE partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0
ORDER BY creationdate DESC
LIMIT 10;

-- 4. Tổng hợp
SELECT 
  'Tổng phiếu' as chi_so,
  COUNT(*) as gia_tri
FROM work_orders
UNION ALL
SELECT 
  'Phiếu paid',
  COUNT(*)
FROM work_orders
WHERE paymentstatus = 'paid'
UNION ALL
SELECT 
  'Paid đã trừ kho OK',
  COUNT(*)
FROM work_orders
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = TRUE
UNION ALL
SELECT 
  'Paid CHƯA trừ kho (LỖI)',
  COUNT(*)
FROM work_orders
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0;

-- 5. Kiểm tra Functions
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'work_order_create_atomic' 
      AND pg_get_function_arguments(oid) LIKE '%p_vehicle_id%' THEN 'OK'
    WHEN proname = 'work_order_update_atomic' 
      AND pg_get_function_arguments(oid) LIKE '%p_vehicle_id%' 
      AND pg_get_function_arguments(oid) LIKE '%p_current_km%' THEN 'OK'
    WHEN proname = 'work_order_complete_payment' 
      AND pg_get_function_arguments(oid) LIKE '%p_payment_method%' THEN 'OK'
    WHEN proname = 'work_order_refund_atomic' THEN 'OK'
    ELSE 'SAI'
  END as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'work_order_create_atomic',
    'work_order_update_atomic',
    'work_order_complete_payment',
    'work_order_refund_atomic'
  )
ORDER BY proname;
