-- Tạo đơn hàng giao ship COD mẫu để test
-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- Script này tự động lấy user ID và branch ID từ dữ liệu có sẵn

-- Tạo đơn hàng pending (chờ xử lý)
INSERT INTO sales (
  id,
  date, 
  items, 
  subtotal, 
  discount, 
  total, 
  customer, 
  paymentmethod, 
  userid, 
  username, 
  branchid,
  sale_code,
  delivery_method,
  delivery_status,
  delivery_address,
  delivery_phone,
  shipping_fee,
  cod_amount,
  estimated_delivery_date
)
SELECT 
  gen_random_uuid(),
  NOW(),
  '[
    {"partId":"part-demo-1","partName":"Nhớt Castrol 10W40","sku":"CASTROL-10W40","quantity":2,"sellingPrice":150000,"category":"Nhớt xe"},
    {"partId":"part-demo-2","partName":"Phanh sau","sku":"PHANH-SAU-01","quantity":1,"sellingPrice":80000,"category":"Phụ tùng"}
  ]'::jsonb,
  380000,
  0,
  380000,
  '{"name":"Nguyễn Văn A","phone":"0901234567"}'::jsonb,
  'cash',
  (SELECT userid FROM sales WHERE userid IS NOT NULL LIMIT 1),
  'Demo User',
  (SELECT branchid FROM sales WHERE branchid IS NOT NULL LIMIT 1),
  'BH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-DEMO',
  'delivery',
  'pending',
  '123 Đường Lê Lai, Phường Bến Thành, Quận 1, TP.HCM',
  '0901234567',
  25000,
  405000,
  NOW() + INTERVAL '2 days';

-- Tạo đơn hàng preparing (đang chuẩn bị)
INSERT INTO sales (
  id,
  date, items, subtotal, discount, total, customer, paymentmethod, 
  userid, username, branchid, sale_code,
  delivery_method, delivery_status, delivery_address, delivery_phone,
  shipping_fee, cod_amount, estimated_delivery_date
)
SELECT
  gen_random_uuid(),
  NOW() - INTERVAL '30 minutes',
  '[{"partId":"part-demo-3","partName":"Lọc nhớt","sku":"LOC-NHOT","quantity":4,"sellingPrice":35000}]'::jsonb,
  140000, 0, 140000,
  '{"name":"Trần Thị B","phone":"0912345678"}'::jsonb,
  'cash',
  (SELECT userid FROM sales WHERE userid IS NOT NULL LIMIT 1),
  'Demo User',
  (SELECT branchid FROM sales WHERE branchid IS NOT NULL LIMIT 1),
  'BH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-DEMO2',
  'delivery', 'preparing',
  '456 Nguyễn Trãi, Phường 7, Quận 5, TP.HCM',
  '0912345678',
  20000, 160000,
  NOW() + INTERVAL '1 day';

-- Tạo đơn hàng shipping (đang giao)
INSERT INTO sales (
  id,
  date, items, subtotal, discount, total, customer, paymentmethod, 
  userid, username, branchid, sale_code,
  delivery_method, delivery_status, delivery_address, delivery_phone,
  shipping_fee, cod_amount, estimated_delivery_date
)
SELECT
  gen_random_uuid(),
  NOW() - INTERVAL '1 hour',
  '[{"partId":"part-demo-4","partName":"Dây curoa","sku":"CUROA-01","quantity":1,"sellingPrice":250000}]'::jsonb,
  250000, 0, 250000,
  '{"name":"Lê Văn C","phone":"0923456789"}'::jsonb,
  'cash',
  (SELECT userid FROM sales WHERE userid IS NOT NULL LIMIT 1),
  'Demo User',
  (SELECT branchid FROM sales WHERE branchid IS NOT NULL LIMIT 1),
  'BH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-DEMO3',
  'delivery', 'shipping',
  '789 Võ Văn Tần, Phường 5, Quận 3, TP.HCM',
  '0923456789',
  30000, 280000,
  NOW() + INTERVAL '3 hours';

-- Kiểm tra kết quả
SELECT 
  sale_code,
  delivery_status,
  delivery_address,
  cod_amount,
  shipping_fee,
  estimated_delivery_date,
  customer->>'name' as customer_name,
  customer->>'phone' as customer_phone
FROM sales 
WHERE delivery_method = 'delivery'
ORDER BY date DESC
LIMIT 10;
