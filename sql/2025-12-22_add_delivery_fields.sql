-- Migration: Add delivery and COD fields to sales table
-- Date: 2025-12-22
-- Purpose: Support delivery orders and COD payment tracking

-- Add delivery-related columns to sales table
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_note TEXT,
  ADD COLUMN IF NOT EXISTS shipper_id TEXT REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS cod_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMP;

-- Add check constraints for valid values
ALTER TABLE sales 
  ADD CONSTRAINT check_delivery_method 
    CHECK (delivery_method IN ('pickup', 'delivery'));

ALTER TABLE sales 
  ADD CONSTRAINT check_delivery_status 
    CHECK (delivery_status IN ('pending', 'preparing', 'shipping', 'delivered', 'cancelled') OR delivery_status IS NULL);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_delivery_status ON sales(delivery_status) WHERE delivery_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_shipper_id ON sales(shipper_id) WHERE shipper_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_delivery_date ON sales(estimated_delivery_date) WHERE estimated_delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_delivery_method ON sales(delivery_method);

-- Add comment for documentation
COMMENT ON COLUMN sales.delivery_method IS 'Pickup from store or delivery to customer';
COMMENT ON COLUMN sales.delivery_status IS 'Current delivery status: pending, preparing, shipping, delivered, cancelled';
COMMENT ON COLUMN sales.cod_amount IS 'Cash on delivery amount to collect from customer';
COMMENT ON COLUMN sales.shipping_fee IS 'Delivery fee charged to customer';
COMMENT ON COLUMN sales.shipper_id IS 'Employee assigned to deliver the order';

-- Update existing sales to have default pickup method
UPDATE sales 
SET delivery_method = 'pickup' 
WHERE delivery_method IS NULL;
