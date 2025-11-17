-- Add vehicleid column to work_orders table to link to specific vehicle

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS vehicleid TEXT;

COMMENT ON COLUMN work_orders.vehicleid IS 'ID của xe cụ thể từ customer.vehicles[] array';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicleid ON work_orders(vehicleid);

-- Note: vehicleModel and licensePlate columns are kept for backward compatibility
