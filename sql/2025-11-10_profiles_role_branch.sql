-- =====================================================
-- Ensure role/branch_id columns on profiles and/or user_profiles
-- Date: 2025-11-10
-- Idempotent: only adds columns if missing.
-- =====================================================

DO $$
BEGIN
  -- profiles (Supabase default)
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN role text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='profiles' AND column_name='branch_id'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN branch_id text;
    END IF;
  END IF;

  -- user_profiles (if project uses a separate table)
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='user_profiles' AND column_name='role'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN role text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='user_profiles' AND column_name='branch_id'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN branch_id text;
    END IF;
  END IF;
END $$;

-- Optional helpers (run manually):
--  -- Set your current user's role and branch
--  -- Replace <uid> and values as needed
--  -- update public.profiles set role='owner', branch_id='HCM' where id='<uid>';
--  -- select id, role, branch_id from public.profiles where id='<uid>';
