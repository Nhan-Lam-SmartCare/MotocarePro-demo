-- SQL script: Thêm các cột cần thiết cho bảng customers trên Supabase
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS vehicleModel text,
ADD COLUMN IF NOT EXISTS licensePlate text,
ADD COLUMN IF NOT EXISTS vehicles jsonb,
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS segment text,
ADD COLUMN IF NOT EXISTS loyaltyPoints integer,
ADD COLUMN IF NOT EXISTS totalSpent numeric,
ADD COLUMN IF NOT EXISTS visitCount integer,
ADD COLUMN IF NOT EXISTS lastVisit timestamptz;

-- Nếu đã có dữ liệu, các cột mới sẽ mặc định là NULL.
-- Bạn có thể chạy script này trong SQL Editor của Supabase.