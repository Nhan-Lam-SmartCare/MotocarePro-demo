-- Fix RLS Policies for fixed_assets and capital
-- Đảm bảo policies check đúng user_profiles và role

-- =============================================
-- 1. DROP OLD POLICIES
-- =============================================

-- Capital policies
DROP POLICY IF EXISTS "capital_select_policy" ON capital;
DROP POLICY IF EXISTS "capital_insert_policy" ON capital;
DROP POLICY IF EXISTS "capital_update_policy" ON capital;
DROP POLICY IF EXISTS "capital_delete_policy" ON capital;

-- Fixed Assets policies
DROP POLICY IF EXISTS "fixed_assets_select_policy" ON fixed_assets;
DROP POLICY IF EXISTS "fixed_assets_insert_policy" ON fixed_assets;
DROP POLICY IF EXISTS "fixed_assets_update_policy" ON fixed_assets;
DROP POLICY IF EXISTS "fixed_assets_delete_policy" ON fixed_assets;

-- =============================================
-- 2. CREATE NEW POLICIES - CAPITAL
-- =============================================

-- SELECT: Owner và Manager có thể xem
CREATE POLICY "capital_select_policy" ON capital
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- INSERT: Owner và Manager có thể thêm
CREATE POLICY "capital_insert_policy" ON capital
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- UPDATE: Owner và Manager có thể cập nhật
CREATE POLICY "capital_update_policy" ON capital
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- DELETE: Chỉ Owner có thể xóa
CREATE POLICY "capital_delete_policy" ON capital
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );

-- =============================================
-- 3. CREATE NEW POLICIES - FIXED ASSETS
-- =============================================

-- SELECT: Owner và Manager có thể xem
CREATE POLICY "fixed_assets_select_policy" ON fixed_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- INSERT: Owner và Manager có thể thêm
CREATE POLICY "fixed_assets_insert_policy" ON fixed_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- UPDATE: Owner và Manager có thể cập nhật
CREATE POLICY "fixed_assets_update_policy" ON fixed_assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- DELETE: Chỉ Owner có thể xóa
CREATE POLICY "fixed_assets_delete_policy" ON fixed_assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );

-- =============================================
-- 4. VERIFY POLICIES
-- =============================================
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('fixed_assets', 'capital')
ORDER BY tablename, cmd;

-- =============================================
-- 5. TEST AUTH
-- =============================================
-- Kiểm tra user hiện tại
SELECT 
  auth.uid() as current_user_id,
  up.email,
  up.role,
  up.full_name
FROM user_profiles up
WHERE up.id = auth.uid();
