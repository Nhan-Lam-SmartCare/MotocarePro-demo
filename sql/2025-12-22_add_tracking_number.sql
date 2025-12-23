-- Add tracking number column for delivery orders
-- Run this after the initial delivery migration

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- Add comment
COMMENT ON COLUMN sales.tracking_number IS 'Mã vận đơn từ đơn vị vận chuyển (GHN, GHTK, etc.)';

-- Add index for quick lookup by tracking number
CREATE INDEX IF NOT EXISTS idx_sales_tracking_number ON sales(tracking_number) WHERE tracking_number IS NOT NULL;
