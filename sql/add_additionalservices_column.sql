-- ============================================
-- THÊM COLUMN additionalServices VÀO work_orders
-- ============================================

-- Thêm column để lưu dịch vụ bổ sung (gia công, đặt hàng)
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS "additionalServices" JSONB DEFAULT '[]'::jsonb;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'work_orders'
  AND column_name = 'additionalServices';

-- Test
SELECT id, "additionalServices"
FROM work_orders 
LIMIT 1;
