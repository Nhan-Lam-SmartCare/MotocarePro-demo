-- Kiểm tra work_order_id trong customer_debts
SELECT 
  id,
  customer_name,
  work_order_id,
  total_amount,
  remaining_amount,
  created_date
FROM customer_debts
WHERE customer_name = 'Nguyễn Văn Tấn'
ORDER BY created_date DESC;
