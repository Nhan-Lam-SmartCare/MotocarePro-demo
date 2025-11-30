-- Allow all authenticated users (including staff) to INSERT customers
-- This is needed because staff creates customers from work order form

DO $$
BEGIN
  -- Drop existing modify policy that only allows manager/owner
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='customers_modify'
  ) THEN
    DROP POLICY customers_modify ON public.customers;
  END IF;

  -- Create separate policies for INSERT, UPDATE, DELETE
  
  -- INSERT: Allow all authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='customers_insert'
  ) THEN
    CREATE POLICY customers_insert ON public.customers 
      FOR INSERT TO authenticated 
      WITH CHECK (TRUE);
  END IF;

  -- UPDATE: Allow all authenticated users (staff can update customer info too)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='customers_update'
  ) THEN
    CREATE POLICY customers_update ON public.customers 
      FOR UPDATE TO authenticated 
      USING (TRUE) 
      WITH CHECK (TRUE);
  END IF;

  -- DELETE: Only manager or owner can delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='customers_delete'
  ) THEN
    CREATE POLICY customers_delete ON public.customers 
      FOR DELETE TO authenticated 
      USING (public.mc_is_manager_or_owner());
  END IF;
END;
$$;
