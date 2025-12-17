-- Kiểm tra phiếu SC-1765956930192
SELECT 
  '1. Thông tin phiếu' as section,
  id,
  customername,
  total,
  totalpaid,
  paymentstatus,
  laborCost,
  additionalServices,
  creationdate
FROM work_orders
WHERE id = 'SC-1765956930192';

-- Kiểm tra giao dịch tiền mặt liên quan
SELECT 
  '2. Giao dịch tiền mặt' as section,
  id,
  type,
  category,
  amount,
  description,
  date,
  paymentsource
FROM cash_transactions
WHERE reference = 'SC-1765956930192'
ORDER BY date;

-- Kiểm tra chi tiết dịch vụ bổ sung
SELECT 
  '3. Chi tiết dịch vụ' as section,
  additionalServices
FROM work_orders
WHERE id = 'SC-1765956930192';
