-- Script kiểm tra schema bảng cashtransactions trên Pin Factory
-- Chạy trên Supabase Dashboard của Pin Factory

-- BƯỚC 1: Xem tất cả cột của bảng (CHẠY TRƯỚC)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cashtransactions'
ORDER BY ordinal_position;

-- BƯỚC 2: Xem 10 giao dịch gần nhất (SAU KHI BIẾT CỘT)
SELECT * FROM cashtransactions 
ORDER BY date DESC 
LIMIT 10;
