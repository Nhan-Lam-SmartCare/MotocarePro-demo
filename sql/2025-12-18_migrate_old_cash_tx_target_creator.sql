-- Migrate existing Cash Transactions to populate target_name and created_by
-- Date: 2025-12-18

-- Update sale_income transactions
-- We join cash_transactions with sales to get customer name and creator
UPDATE cash_transactions ct
SET 
  target_name = COALESCE(s.customer->>'name', 'Khách lẻ'),
  created_by = s.userid
FROM sales s
WHERE 
  ct.category = 'sale_income' 
  AND (
    ct.reference = s.sale_code -- For transactions already migrated to sale_code
    OR 
    ct.reference = s.id::text  -- For transactions still using UUID as reference
  )
  AND (ct.target_name IS NULL OR ct.created_by IS NULL);
