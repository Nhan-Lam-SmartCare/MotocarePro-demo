-- ============================================================================
-- THÊM RLS POLICY CHO TRANG SHOP CÔNG KHAI
-- ============================================================================
-- Date: 2026-01-07
-- Purpose: Cho phép khách hàng xem sản phẩm không cần đăng nhập
-- ============================================================================

-- Policy: Cho phép SELECT công khai cho bảng parts (chỉ đọc)
CREATE POLICY "Public can view active parts"
ON public.parts
FOR SELECT
USING (true);

-- Nếu muốn giới hạn chỉ hiển thị sản phẩm còn hàng, dùng:
-- USING ((stock IS NOT NULL AND jsonb_typeof(stock) = 'object'));

-- ============================================================================
-- HƯỚNG DẪN
-- ============================================================================
-- 1. Mở Supabase Dashboard → SQL Editor
-- 2. Paste đoạn code trên
-- 3. Nhấn Run
-- 4. Refresh trang shop
-- ============================================================================
