-- =====================================================================
-- 🏥 KIỂM TRA SỨC KHỎE HỆ THỐNG PHIẾU SỬA CHỮA
-- =====================================================================

-- 1️⃣ CẤU TRÚC BẢNG work_orders
SELECT 
  '1️⃣ Cấu trúc work_orders' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULL'
    ELSE '🔒 NOT NULL'
  END as nullable
FROM information_schema.columns
WHERE table_name = 'work_orders'
  AND column_name IN ('vehicleid', 'currentkm', 'inventory_deducted', 'paymentstatus')
ORDER BY ordinal_position;

-- 1️⃣.2 CẤU TRÚC BẢNG parts
SELECT 
  '1️⃣.2 Cấu trúc parts' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULL'
    ELSE '🔒 NOT NULL'
  END as nullable
FROM information_schema.columns
WHERE table_name = 'parts'
  AND column_name IN ('stock', 'reservedstock')
ORDER BY ordinal_position;

-- =====================================================================
-- 2️⃣ KIỂM TRA FUNCTIONS
-- =====================================================================

WITH function_params AS (
  SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type,
    CASE 
      WHEN p.proname = 'work_order_create_atomic' 
        AND pg_get_function_arguments(p.oid) LIKE '%p_vehicle_id%' THEN '✅'
      WHEN p.proname = 'work_order_update_atomic' 
        AND pg_get_function_arguments(p.oid) LIKE '%p_vehicle_id%' 
        AND pg_get_function_arguments(p.oid) LIKE '%p_current_km%' THEN '✅'
      WHEN p.proname = 'work_order_complete_payment' 
        AND pg_get_function_arguments(p.oid) LIKE '%p_payment_method%' 
        AND position('p_payment_method' in pg_get_function_arguments(p.oid)) < position('p_payment_amount' in pg_get_function_arguments(p.oid)) THEN '✅'
      WHEN p.proname = 'work_order_refund_atomic' THEN '✅'
      ELSE '❌ Sai'
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
  '2️⃣ Functions' as check_name,
  function_name,
  status,
  LEFT(parameters, 80) as params
FROM function_params
ORDER BY function_name;

-- =====================================================================
-- 3️⃣ KIỂM TRA DỮ LIỆU
-- =====================================================================

-- 3.1 Phiếu paid nhưng chưa trừ kho
SELECT 
  '3.1 Paid chưa trừ kho' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '❌ Có ' || COUNT(*) || ' phiếu'
  END as status
FROM work_orders
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0;

-- 3.2 Phiếu có xuất kho nhưng chưa đánh dấu
SELECT 
  '3.2 Có xuất kho nhưng chưa mark' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ Có ' || COUNT(*) || ' phiếu'
  END as status
FROM work_orders wo
WHERE paymentstatus = 'paid'
  AND COALESCE(inventory_deducted, FALSE) = FALSE
  AND EXISTS (
    SELECT 1 FROM inventory_transactions it
    WHERE it."workOrderId" = wo.id AND it.type = 'Xuất kho'
  );

-- 3.3 Reserved stock âm
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
  '3.3 Reserved âm' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '❌ Có ' || COUNT(*) || ' parts'
  END as status
FROM reserved_check
WHERE reserved_qty < 0;

-- 3.4 Reserved > Stock
WITH stock_comparison AS (
  SELECT 
    id,
    name,
    jsonb_object_keys(stock) as branch_id,
    (stock->>jsonb_object_keys(stock))::int as stock_qty,
    COALESCE((reservedstock->>jsonb_object_keys(stock))::int, 0) as reserved_qty
  FROM parts
  WHERE stock IS NOT NULL
)
SELECT 
  '3.4 Reserved > Stock' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ Có ' || COUNT(*) || ' cases'
  END as status
FROM stock_comparison
WHERE reserved_qty > stock_qty;

-- =====================================================================
-- 4️⃣ 10 PHIẾU MỚI NHẤT
-- =====================================================================

SELECT 
  '4️⃣ Phiếu gần đây' as check_name,
  SUBSTRING(id FROM 4) as code,
  customername as customer,
  DATE(creationdate) as date,
  paymentstatus,
  total,
  totalpaid,
  COALESCE(inventory_deducted, FALSE) as inv_deducted,
  CASE 
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = TRUE THEN '✅'
    WHEN paymentstatus = 'paid' AND COALESCE(inventory_deducted, FALSE) = FALSE THEN '❌'
    WHEN paymentstatus = 'unpaid' THEN '⏳'
    ELSE '⚠️'
  END as status
FROM work_orders
WHERE partsused IS NOT NULL
  AND jsonb_array_length(partsused) > 0
ORDER BY creationdate DESC
LIMIT 10;

-- =====================================================================
-- 5️⃣ TÓM TẮT
-- =====================================================================

WITH summary AS (
  SELECT 
    'Tổng phiếu' as metric,
    COUNT(*)::text as value,
    '📋' as icon
  FROM work_orders
  
  UNION ALL
  
  SELECT 
    'Phiếu paid',
    COUNT(*)::text,
    '💰'
  FROM work_orders
  WHERE paymentstatus = 'paid'
  
  UNION ALL
  
  SELECT 
    'Paid + trừ kho OK',
    COUNT(*)::text,
    '✅'
  FROM work_orders
  WHERE paymentstatus = 'paid'
    AND COALESCE(inventory_deducted, FALSE) = TRUE
  
  UNION ALL
  
  SELECT 
    'Paid chưa trừ kho',
    COUNT(*)::text,
    CASE WHEN COUNT(*) > 0 THEN '❌' ELSE '✅' END
  FROM work_orders
  WHERE paymentstatus = 'paid'
    AND COALESCE(inventory_deducted, FALSE) = FALSE
    AND partsused IS NOT NULL
    AND jsonb_array_length(partsused) > 0
  
  UNION ALL
  
  SELECT 
    'Functions OK',
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
  '5️⃣ TÓM TẮT' as section,
  icon,
  metric,
  value
FROM summary;
