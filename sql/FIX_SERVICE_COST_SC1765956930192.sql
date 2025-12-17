-- Tạo giao dịch CHI cho giá vốn dịch vụ - Phiếu SC-1765956930192
-- Chạy script này NGAY để fix phiếu hiện tại

INSERT INTO cash_transactions(
  id, 
  type, 
  category, 
  amount, 
  date, 
  description, 
  branchid, 
  paymentsource, 
  reference
)
VALUES (
  gen_random_uuid()::text,
  'expense',
  'service_cost',
  360000, -- 15,000 + 345,000
  '2025-12-17'::timestamp,
  'Giá vốn dịch vụ gia công - Phiếu SC-1765956930192 (Pun tu 15k + Làm đầu nòng 345k)',
  'CN1',
  'Tiền mặt',
  'SC-1765956930192'
);

SELECT 'Đã tạo giao dịch CHI 360,000đ cho phiếu SC-1765956930192' as result;
