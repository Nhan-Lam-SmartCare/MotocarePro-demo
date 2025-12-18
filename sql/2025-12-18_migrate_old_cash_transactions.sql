-- Migrate existing Cash Transactions to use readable Sale Code
-- Date: 2025-12-18

-- Update description and reference for existing sale_income transactions
-- This joins cash_transactions with sales using the current reference (which is sale_id)
-- and updates it to use the sale_code.

UPDATE cash_transactions ct
SET 
  description = 'Thu từ hóa đơn ' || s.sale_code,
  reference = s.sale_code
FROM sales s
WHERE 
  ct.category = 'sale_income' 
  AND ct.reference = s.id::text  -- Currently reference holds the UUID
  AND s.sale_code IS NOT NULL;   -- Only update if we have a sale code
