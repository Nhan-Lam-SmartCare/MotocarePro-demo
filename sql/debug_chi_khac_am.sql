-- Debug: Tìm các giao dịch CHI có số tiền ÂM hoặc các giao dịch lạ

-- 1. Tìm các giao dịch CHI (expense) có amount ÂM
SELECT 
  date::date as ngay,
  type,
  category,
  amount,
  description,
  paymentsource
FROM cash_transactions
WHERE type = 'expense'
  AND date >= '2025-12-01'
  AND category NOT IN ('supplier_payment', 'goods_receipt', 'import')
  AND (
    category NOT ILIKE '%nhập%'
    AND category NOT ILIKE '%kho%'
  )
ORDER BY date DESC, amount ASC;

-- 2. Thống kê CHI KHÁC theo ngày trong tháng 12
SELECT 
  date::date as ngay,
  COUNT(*) as so_giao_dich,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as tong_chi_duong,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as tong_chi_am,
  SUM(amount) as tong_chi_net
FROM cash_transactions
WHERE type = 'expense'
  AND date >= '2025-12-01'
  AND date < '2025-12-19'
  AND category NOT IN ('supplier_payment', 'goods_receipt', 'import')
  AND (
    category NOT ILIKE '%nhập%'
    AND category NOT ILIKE '%kho%'
  )
GROUP BY date::date
ORDER BY date::date DESC;

-- 3. Chi tiết ngày 16/12 (có CHI KHÁC = -1.208.000đ)
SELECT 
  *
FROM cash_transactions
WHERE type = 'expense'
  AND date::date = '2025-12-16'
  AND category NOT IN ('supplier_payment', 'goods_receipt', 'import')
  AND (
    category NOT ILIKE '%nhập%'
    AND category NOT ILIKE '%kho%'
  )
ORDER BY amount DESC;
