-- Force confirm and assign roles for Gmail demo users

-- 1) Confirm emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
  'owner.motocare.test@gmail.com',
  'manager.motocare.test@gmail.com',
  'staff.motocare.test@gmail.com'
);

-- 2) Ensure profiles exist with proper roles
INSERT INTO user_profiles (id, email, role, full_name, is_active)
SELECT u.id,
       u.email,
       CASE
         WHEN u.email = 'owner.motocare.test@gmail.com' THEN 'owner'
         WHEN u.email = 'manager.motocare.test@gmail.com' THEN 'manager'
         ELSE 'staff'
       END,
       CASE
         WHEN u.email = 'owner.motocare.test@gmail.com' THEN 'Chủ cửa hàng'
         WHEN u.email = 'manager.motocare.test@gmail.com' THEN 'Quản lý'
         ELSE 'Nhân viên'
       END,
       true
FROM auth.users u
WHERE u.email IN (
  'owner.motocare.test@gmail.com',
  'manager.motocare.test@gmail.com',
  'staff.motocare.test@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_active = true;

-- 3) Verify
SELECT email, role, full_name FROM user_profiles 
WHERE email IN (
  'owner.motocare.test@gmail.com',
  'manager.motocare.test@gmail.com',
  'staff.motocare.test@gmail.com'
)
ORDER BY role;