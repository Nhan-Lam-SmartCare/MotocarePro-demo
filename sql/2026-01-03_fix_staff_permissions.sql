-- Fix staff user permissions
-- Date: 2026-01-03
-- Issue: User nguyenthanhloc28052007@gmail.com cannot create work orders
-- Root cause: Profile may not have correct role/branch_id set

-- Ensure user has correct role and branch
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'nguyenthanhloc28052007@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Update or insert profile
    INSERT INTO public.profiles (id, email, role, branch_id, full_name, created_at, updated_at)
    VALUES (
      v_user_id,
      'nguyenthanhloc28052007@gmail.com',
      'staff',
      'CN1',
      'Nguyễn Thành Lộc',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      role = 'staff',
      branch_id = 'CN1',
      email = 'nguyenthanhloc28052007@gmail.com',
      updated_at = NOW();

    RAISE NOTICE 'Updated profile for user: % (ID: %)', 'nguyenthanhloc28052007@gmail.com', v_user_id;
  ELSE
    RAISE NOTICE 'User not found: %', 'nguyenthanhloc28052007@gmail.com';
  END IF;
END$$;

-- Verify the update
SELECT 
  id,
  email,
  role,
  branch_id,
  full_name
FROM public.profiles
WHERE email = 'nguyenthanhloc28052007@gmail.com';

-- Also check the auth.users table to ensure user exists
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'nguyenthanhloc28052007@gmail.com';
