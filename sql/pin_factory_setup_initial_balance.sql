-- Script thiết lập số dư ban đầu cho Pin Factory
-- Chạy script này trên Supabase Dashboard của Pin Factory Database

-- Kiểm tra xem bảng payment_sources đã tồn tại chưa
CREATE TABLE IF NOT EXISTS payment_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm hoặc cập nhật số dư ban đầu cho CN1
-- QUAN TRỌNG: Thay đổi số tiền theo số dư thực tế hiện tại của bạn
INSERT INTO payment_sources (id, name, type, balance)
VALUES 
  ('cash', 'Tiền mặt', 'cash', '{"CN1": 0}'::jsonb),
  ('bank', 'Ngân hàng', 'bank', '{"CN1": 0}'::jsonb)
ON CONFLICT (id) 
DO UPDATE SET 
  balance = EXCLUDED.balance,
  updated_at = NOW();

-- Xem số dư hiện tại
SELECT 
  id,
  name,
  balance,
  balance->>'CN1' as cn1_balance
FROM payment_sources
WHERE id IN ('cash', 'bank');

-- ====================================
-- HƯỚNG DẪN SỬ DỤNG:
-- ====================================
-- 1. Mở ứng dụng Pin Corp trên điện thoại
-- 2. Vào phần Sổ quỹ, xem số dư thực tế hiện tại:
--    - Tiền mặt: Kiểm tra két tiền
--    - Ngân hàng: Kiểm tra sao kê tài khoản
-- 3. Cập nhật số tiền vào script trên (thay 0 bằng số thực tế)
-- 4. Chạy script này trên Supabase Dashboard
-- 5. Reload trang web để thấy số dư chính xác

-- VÍ DỤ: Nếu tiền mặt thực tế là 5.000.000 đ và ngân hàng là 10.000.000 đ:
-- UPDATE payment_sources 
-- SET balance = jsonb_set(balance, '{CN1}', '5000000', true)
-- WHERE id = 'cash';
-- 
-- UPDATE payment_sources 
-- SET balance = jsonb_set(balance, '{CN1}', '10000000', true)
-- WHERE id = 'bank';
