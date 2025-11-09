-- =====================================================
-- Force Confirm Email for Demo Users
-- =====================================================
-- Run this if users cannot login due to unconfirmed email

UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email IN (
  'owner@motocare.vn',
  'manager@motocare.vn', 
  'staff@motocare.vn'
);

-- Verify
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email IN (
  'owner@motocare.vn',
  'manager@motocare.vn',
  'staff@motocare.vn'
);
