-- =====================================================
-- CLEAN RLS POLICY RESET FOR user_profiles (Dev Safe Version)
-- =====================================================
-- Purpose: Remove recursive policies and recreate minimal, non-recursive, role-based access.
-- Run order: Just execute this whole script once.
-- Notes:
--  * Uses helper functions is_owner() and is_owner_or_manager() with SECURITY DEFINER.
--  * SELECT allowed for owner/manager to view all; others can view only themselves.
--  * UPDATE allowed for self; owner can update any.
--  * INSERT allowed only for owner.
--  * DELETE allowed only for owner.
--  * Adjust as needed for production (add logging, tighter conditions).
-- =====================================================

-- 1. Ensure RLS enabled (idempotent)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop old problematic policies (ignore errors if not exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Owners and managers can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only owners can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only owners can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "select_profiles_dev" ON public.user_profiles;
DROP POLICY IF EXISTS "self_update_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "owner_update_any_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "owner_insert_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "owner_delete_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "select_profiles_all_if_manager_owner" ON public.user_profiles;

-- 3. Helper functions (SECURITY DEFINER bypasses RLS internally safely)
CREATE OR REPLACE FUNCTION public.user_role() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r text;
BEGIN
  SELECT role INTO r FROM public.user_profiles WHERE id = auth.uid();
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN user_role() = 'owner';
END; $$;

CREATE OR REPLACE FUNCTION public.is_owner_or_manager() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN user_role() IN ('owner','manager');
END; $$;

-- 4. SELECT policy (non recursive):
-- Owner/Manager can see all; staff only sees their own row.
CREATE POLICY "select_user_profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ( is_owner_or_manager() OR auth.uid() = id );

-- 5. UPDATE policies
-- Self edit
CREATE POLICY "update_self_user_profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- Owner edit any
CREATE POLICY "owner_update_any_user_profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING ( is_owner() )
  WITH CHECK ( true );

-- 6. INSERT (only owner) - INSERT can only have WITH CHECK
CREATE POLICY "owner_insert_user_profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ( is_owner() );

-- 7. DELETE (only owner)
CREATE POLICY "owner_delete_user_profile"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING ( is_owner() );

-- 8. OPTIONAL: Verify
-- SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
--   WHERE schemaname='public' AND tablename='user_profiles';

-- 9. QUICK TEST QUERIES (uncomment to run manually)
-- -- Should return current user's profile for staff, all for owner/manager
-- -- SELECT * FROM public.user_profiles;

-- =====================================================
-- End of script
-- =====================================================
