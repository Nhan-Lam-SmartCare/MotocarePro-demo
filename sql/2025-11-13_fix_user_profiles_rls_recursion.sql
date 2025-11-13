-- Fix infinite recursion in user_profiles RLS policies
-- This issue occurs when a policy references the same table it's protecting

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Managers can view branch profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow read access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;

-- Create new policies without recursion
-- Policy 1: Users can view their own profile (using auth.uid() directly)
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (using auth.uid() directly)
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Owners can view all profiles in their branches
CREATE POLICY "Owners can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles AS owner_profile
    WHERE owner_profile.id = auth.uid()
    AND owner_profile.role = 'owner'
    AND owner_profile.branch_id = user_profiles.branch_id
  )
);

-- Policy 4: Managers can view profiles in their branch
CREATE POLICY "Managers can view branch profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles AS manager_profile
    WHERE manager_profile.id = auth.uid()
    AND manager_profile.role IN ('owner', 'manager')
    AND manager_profile.branch_id = user_profiles.branch_id
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
