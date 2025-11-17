-- Add additionalServices column to work_orders table to store outsourcing/custom services

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS additionalServices JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN work_orders.additionalServices IS 'Danh sách dịch vụ gia công/đặt hàng bên ngoài với giá nhập và giá bán';
