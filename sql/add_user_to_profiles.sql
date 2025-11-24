-- Thêm user hiện tại vào user_profiles với role owner
-- Chạy script này trong Supabase SQL Editor

-- Bước 1: Kiểm tra tất cả users trong hệ thống
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Bước 2: Kiểm tra user_profiles hiện có
SELECT * FROM user_profiles;

-- Bước 3: Thêm user với role owner
-- QUAN TRỌNG: Thay 'YOUR-USER-ID-HERE' bằng ID từ bước 1
-- QUAN TRỌNG: Thay 'your-email@example.com' bằng email từ bước 1
-- QUAN TRỌNG: Thay 'branch-1' bằng branch_id thực tế trong bảng branches

INSERT INTO user_profiles (id, role, email, full_name, branch_id)
VALUES (
  'YOUR-USER-ID-HERE',  -- Thay bằng user ID thực tế
  'owner',
  'your-email@example.com',  -- Thay bằng email thực tế
  'Admin User',
  'branch-1'  -- Thay bằng branch_id thực tế
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'owner';

-- Bước 4: Kiểm tra lại
SELECT * FROM user_profiles;
