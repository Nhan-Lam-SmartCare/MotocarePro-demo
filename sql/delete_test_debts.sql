-- Xóa TẤT CẢ debts để test lại từ đầu
DELETE FROM customer_debts;

-- Verify (should return empty)
SELECT id, customer_name, phone, license_plate, total_amount, remaining_amount
FROM customer_debts
ORDER BY created_date DESC
LIMIT 5;
