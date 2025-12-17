-- =====================================================================
-- 🏥 KIỂM TRA SỨC KHỎE TỔNG THỂ HỆ THỐNG PHIẾU SỬA CHỮA
-- =====================================================================
-- Copy và chạy toàn bộ script này trên Supabase
-- =====================================================================

-- =====================================================================
-- 1. KIỂM TRA CẤU TRÚC DATABASE
-- =====================================================================
-- 1️⃣ KIỂM TRA CẤU TRÚC BẢNG work_orders

SELECT 
  '1️⃣ Cấu trúc work_orders' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULL allowed'
    ELSE '🔒 NOT NULL'
  END as nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'work_orders'
  AND column_name IN ('vehicleid', 'currentkm', 'inventory_deducted', 'paymentstatus', 'totalpaid')
ORDER BY ordinal_position;

-- 1️⃣.2 KIỂM TRA CẤU TRÚC BẢNG parts

SELECT 
  '1️⃣.2 Cấu trúc parts' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULL allowed'
    ELSE '🔒 NOT NULL'
  END as nullable
FROM information_schema.columns
WHERE table_name = 'parts'
  AND column_name IN ('stock', 'reservedstock')
ORDER BY ordinal_position;

-- =====================================================================
-- 2. KIỂM TRA CÁC FUNCTIONS
-- =====================================================================

WITH function_params AS (
  SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type,
    CASE 
      WHEN p.proname = 'work_order_create_atomic' AND pg_get_function_arguments(p.oid) LIKE '%p_vehicle_id%' THEN '✅'
      WHEN p.proname = 'work_order_update_atomic' AND pg_get_function_arguments(p.oid) LIKE '%p_vehicle_id%' AND pg_get_function_arguments(p.oid) LIKE '%p_current_km%' THEN '✅'
      WHEN p.proname = 'work_order_complete_payment' AND pg_get_function_arguments(p.oid) LIKE '%p_payment_method%' AND position('p_payment_method' in pg_get_function_arguments(p.oid)) < position('p_payment_amount' in pg_get_function_arguments(p.oid)) THEN '✅'
      WHEN p.proname NOT IN ('work_order_create_atomic', 'work_order_update_atomic', 'work_order_complete_payment') THEN '✅'
      ELSE '❌ Sai signature'
    END as status
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'work_order_create_atomic',
      'work_order_update_atomic', 
      'work_order_complete_payment',
      'work_order_refund_atomic'
    )
)
SELECT 
  status,
  function_name,
  LEFT(parameters, 100) as params_preview,
  '2️⃣ Functions' as check_name,
  return_type
FROM function_params
ORDER BY function_name;

-- =====================================================================
-- 3. KIỂM TRA DỮ LIỆU

-- 3.1 Phiếu đã thanh toán nhưng chưa trừ kho
SELECT 
  '3.1 Paid chưa trừ kho' as check_name,
  COUNT(*) as total_orders,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Không có phiếu lỗi'
    ELSE '⚠️ Có ' || COUNT(*) || ' phiếu cần fix'
  END as status
FROM work_orders
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0;

-- 3.2 Phiếu có inventory transaction nhưng chưa đánh dấu
SELECT 
  '3.2 Có xuất kho nhưng chưa đánh dấu' as check_name,
  COUNT(*) as total_orders,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Không có phiếu lỗi'
    ELSE '⚠️ Có ' || COUNT(*) || ' phiếu cần đánh dấu lại'
  END as status
FROM work_orders wo
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND EXISTS (
    SELECT 1 FROM inventory_transactions it
    WHERE it."workOrderId" = wo.id
      AND it.type = 'Xuất kho'
  );

-- 3.3 Số dư reserved stock âm
\echo '3.3 Kiểm tra reserved stock âm:';
WITH reserved_check AS (
  SELECT 
    id,
    name,
    jsonb_object_keys(reservedstock) as branch_id,
    (reservedstock->>jsonb_object_keys(reservedstock))::int as reserved_qty
  FROM parts
  WHERE reservedstock IS NOT NULL
    AND reservedstock != '{}'::jsonb
)
SELECT 
  COUNT(*) as negative_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Không có reserved âm'
    ELSE '❌ Có ' || COUNT(*) || ' parts có reserved âm'
  END as status
FR'3.3 Reserved stock âm' as check_name,
  COUNT(*) as negative_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Không có reserved âm'
    ELSE '❌ Có ' || COUNT(*) || ' parts có reserved âm'
  END as status
FROM reserved_check
WHERE reserved_qty < 0;

-- 3.4 Reserved > Stockch_id,
    (stock->>jsonb_object_keys(stock))::int as stock_qty,
    COALESCE((reservedstock->>jsonb_object_keys(stock))::int, 0) as reserved_qty
  FROM parts
  WHERE stock IS NOT NULL
)
SELECT 
  COUNT(*) as over_reserved_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Reserved không vượt quá stock'
    ELSE '⚠️ Có ' || COUNT(*) || ' cases reserved > stock'
  END as status
FROM stock_comparison
WHERE reserved_qty > stock_qty;
'3.4 Reserved > Stock' as check_name,
  COUNT(*) as over_reserved_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Reserved không vượt quá stock'
    ELSE '⚠️ Có ' || COUNT(*) || ' cases reserved > stock'
  END as status
FROM stock_comparison
WHERE reserved_qty > stock_qty;

-- =====================================================================
-- 4. KIỂM TRA PHIẾU GẦN ĐÂY
-- =====================================================================

SELECT 
  '4️⃣ 10 phiếu mới nhất' as check_name,SCE(inventory_deducted, FALSE) as inv_deducted,
  CASE 
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = TRUE THEN '✅ OK'
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = FALSE THEN '❌ Paid chưa trừ kho'
    WHEN paymentstatus = 'unpaid' AND COALESCE(inventory_deducted, FALSE) = FALSE THEN '✅ Unpaid chưa trừ'
    WHEN paymentstatus = 'partial' THEN '⚠️ Partial payment'
    ELSE '🔍 Cần kiểm tra'
  END as status
FROM work_orders
WHERE partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0
ORDER BY creationdate DESC
LIMIT 10;

-- =====================================================================
-- 5. TÓM TẮT KẾT QUẢ
-- =====================================================================
\echo '';
\echo '========================================';
\echo '📊 TÓM TẮT';
\echo '========================================';

WITH summary AS (
  SELECT 
    'Tổng phiếu' as metric,
  UNION ALL
  
  SELECT 
    'Phiếu đã thanh toán',
    COUNT(*)::text,
    '✅'
  FROM work_orders
  WHERE paymentstatus = 'paid'
  
  UNION ALL
  
  SELECT 
    'Phiếu paid + trừ kho OK',
    COUNT(*)::text,
    '✅'
  FROM work_orders
  WHERE paymentstatus = 'paid'
    AND COALESCE(inventory_deducted, FALSE) = TRUE
  
  UNION ALL
  
  SELECT 
    'Phiếu paid chưa trừ kho',
    COUNT(*)::text,
    CASE WHEN COUNT(*) > 0 THEN '❌' ELSE '✅' END
  FROM work_orders
  WHERE paymentstatus = 'paid'
    AND COALESCE(inventory_deducted, FALSE) = FALSE
    AND partsused IS NOT NULL
    AND jsonb_array_length(partsused) > 0
  
  UNION ALL
  
  SELECT 
    'Functions có signature đúng',
    COUNT(*)::text || '/4',
    CASE WHEN COUNT(*) = 4 THEN '✅' ELSE '⚠️' END
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'work_order_create_atomic',
      'work_order_update_atomic',
      'work_order_complete_payment',
      'work_order_refund_atomic'
    )
)
SELECT 
  icon || ' ' || metric as "Chỉ số",
  value as "Giá trị"
FROM summary;

\echo '';
\echo '========================================';
\e'📊 TÓM TẮT' as section,
  icon || ' ' || metric as "Chỉ số",
  value as "Giá trị"
FROM summary