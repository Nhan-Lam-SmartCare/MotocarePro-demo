-- Kiểm tra chi tiết các ngày có CHI KHÁC lớn

-- Ngày 3/12 (CHI KHÁC = 2.064.000đ)
SELECT 
  '03/12/2025' as ngay,
  type,
  category,
  amount,
  description,
  paymentsource
FROM cash_transactions
WHERE type = 'expense'
  AND date::date = '2025-12-03'
ORDER BY amount DESC;

-- Ngày 12/12 (CHI KHÁC = 5.000.000đ)
SELECT 
  '12/12/2025' as ngay,
  type,
  category,
  amount,
  description,
  paymentsource
FROM cash_transactions
WHERE type = 'expense'
  AND date::date = '2025-12-12'
ORDER BY amount DESC;

-- Ngày 13/12 (CHI KHÁC = 2.520.000đ)
SELECT 
  '13/12/2025' as ngay,
  type,
  category,
  amount,
  description,
  paymentsource
FROM cash_transactions
WHERE type = 'expense'
  AND date::date = '2025-12-13'
ORDER BY amount DESC;

-- Kiểm tra tất cả category expense trong tháng 12
SELECT 
  DISTINCT category,
  COUNT(*) as so_giao_dich,
  SUM(amount) as tong_tien
FROM cash_transactions
WHERE type = 'expense'
  AND date >= '2025-12-01'
  AND date < '2025-12-19'
GROUP BY category
ORDER BY tong_tien DESC;
