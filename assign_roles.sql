-- =====================================================
-- Assign Roles to Demo Users
-- =====================================================
-- Run this in Supabase SQL Editor after creating users

-- Update roles for the 3 demo users
UPDATE user_profiles 
SET 
  role = 'owner',
  full_name = 'Chủ cửa hàng'
WHERE email = 'owner@motocare.vn';

UPDATE user_profiles 
SET 
  role = 'manager',
  full_name = 'Quản lý'
WHERE email = 'manager@motocare.vn';

UPDATE user_profiles 
SET 
  role = 'staff',
  full_name = 'Nhân viên'
WHERE email = 'staff@motocare.vn';

-- Verify the updates
SELECT 
  email,
  role,
  full_name,
  is_active,
  created_at
FROM user_profiles
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'staff' THEN 3
  END;
