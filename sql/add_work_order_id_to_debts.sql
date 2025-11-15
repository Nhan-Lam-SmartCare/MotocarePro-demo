-- Thêm column work_order_id vào customer_debts để link với work_orders
ALTER TABLE customer_debts
ADD COLUMN IF NOT EXISTS work_order_id TEXT;

-- Tạo index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_customer_debts_work_order_id 
ON customer_debts(work_order_id);

-- Thêm UNIQUE constraint để tránh duplicate debt cho cùng 1 phiếu
-- (Xóa constraint cũ nếu có)
ALTER TABLE customer_debts
DROP CONSTRAINT IF EXISTS unique_work_order_debt;

-- Tạo constraint mới: 1 work_order chỉ có 1 debt
ALTER TABLE customer_debts
ADD CONSTRAINT unique_work_order_debt 
UNIQUE (work_order_id, branch_id);

-- Verify
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_debts'
  AND column_name = 'work_order_id';

-- Check constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'customer_debts'::regclass;
