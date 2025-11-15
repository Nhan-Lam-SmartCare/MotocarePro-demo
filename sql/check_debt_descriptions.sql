-- Kiểm tra nội dung description của debts
SELECT 
  id,
  customer_name,
  description,
  total_amount,
  remaining_amount
FROM customer_debts
WHERE customer_name IN ('Nguyễn Văn Tấn', 'Nguyễn Xuân Nhạn')
ORDER BY created_date DESC;
