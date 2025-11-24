-- Fix RLS Policies cho profiles và user_profiles
-- Cho phép user đọc profile của chính mình

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

-- Drop old policies nếu có
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- Cho phép user xem profile của chính mình
CREATE POLICY "users_select_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Cho phép user cập nhật profile của chính mình
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Cho phép owner xem tất cả profiles
CREATE POLICY "owner_select_all_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'owner'
    )
  );

-- =============================================
-- 2. USER_PROFILES TABLE
-- =============================================

-- Drop old policies nếu có
DROP POLICY IF EXISTS "users_select_own_user_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_user_profile" ON user_profiles;

-- Cho phép user xem user_profile của chính mình
CREATE POLICY "users_select_own_user_profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Cho phép user cập nhật user_profile của chính mình
CREATE POLICY "users_update_own_user_profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Cho phép owner xem tất cả user_profiles
CREATE POLICY "owner_select_all_user_profiles" ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'owner'
    )
  );

-- =============================================
-- 3. VERIFY
-- =============================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'user_profiles')
ORDER BY tablename, cmd;
