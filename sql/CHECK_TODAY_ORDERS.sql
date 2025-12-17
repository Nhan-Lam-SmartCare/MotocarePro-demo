-- Kiểm tra 2 phiếu hôm nay đã trừ kho chưa
SELECT 
  id,
  SUBSTRING(id FROM 4) as order_code,
  customername,
  customerphone,
  total,
  totalpaid,
  paymentstatus,
  inventory_deducted,
  creationdate,
  CASE 
    WHEN inventory_deducted = TRUE THEN '✅ Đã trừ kho'
    WHEN inventory_deducted = FALSE THEN '❌ Chưa trừ kho'
    ELSE '⚠️ NULL (chưa set)'
  END as status
FROM work_orders
WHERE DATE(creationdate) = '2025-12-17'
  AND paymentstatus = 'paid'
ORDER BY creationdate DESC;
