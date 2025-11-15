-- Add sale_id column to customer_debts table for sales debt tracking
-- Similar to work_order_id for service manager
-- Date: 2025-11-15

-- Add sale_id column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customer_debts' AND column_name='sale_id'
    ) THEN
        ALTER TABLE customer_debts ADD COLUMN sale_id TEXT;
        COMMENT ON COLUMN customer_debts.sale_id IS 'ID của hóa đơn bán hàng (nếu công nợ từ trang bán hàng)';
    END IF;
END $$;

-- Create unique index to prevent duplicate debts for same sale
-- A sale can only have one debt record per branch
DROP INDEX IF EXISTS idx_customer_debts_sale_id_branch;
CREATE UNIQUE INDEX idx_customer_debts_sale_id_branch 
ON customer_debts(sale_id, branch_id) 
WHERE sale_id IS NOT NULL;

COMMENT ON INDEX idx_customer_debts_sale_id_branch IS 'Ensure one debt per sale per branch';

-- Note: We now have two linking mechanisms:
-- - work_order_id: For debts from service/repair orders
-- - sale_id: For debts from sales transactions
-- Both use UPSERT pattern to prevent duplicates
