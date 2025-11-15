-- Kiểm tra debt vừa tạo
SELECT 
  id,
  "customerName",
  phone,
  "licensePlate",
  description,
  "totalAmount",
  "paidAmount",
  "remainingAmount",
  "createdDate"
FROM customer_debts
ORDER BY "createdDate" DESC
LIMIT 5;
