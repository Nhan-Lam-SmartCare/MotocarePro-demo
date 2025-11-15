-- ============================================
-- KIỂM TRA RLS CHO WORK_ORDERS
-- ============================================

-- 1. Kiểm tra RLS có được enable không
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'work_orders';

-- 2. Liệt kê tất cả policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'work_orders'
ORDER BY policyname;

-- 3. Kiểm tra số lượng records trong bảng
SELECT COUNT(*) as total_records FROM work_orders;

-- 4. Test query với RLS (như authenticated user)
-- Nếu không trả về dữ liệu, có nghĩa RLS đang block
SELECT id, status, customername, creationdate 
FROM work_orders 
LIMIT 5;

-- ============================================
-- FIX: TẠM THỜI DISABLE RLS (CHỈ ĐỂ TEST)
-- ============================================
-- Uncomment dòng dưới để tạm thời disable RLS
-- ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;

-- Sau khi test xong, nhớ enable lại:
-- ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
