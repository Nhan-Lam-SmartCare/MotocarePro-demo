-- ============================================
-- COMPLETE FIX FOR INVENTORY SYSTEM
-- Run this entire script in Supabase SQL Editor
-- Date: 2025-11-12
-- ============================================

-- 0. Create inventory_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Nhập kho', 'Xuất kho')),
  "partId" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "unitPrice" NUMERIC,
  "totalPrice" NUMERIC NOT NULL DEFAULT 0,
  "branchId" TEXT NOT NULL,
  notes TEXT,
  "saleId" TEXT,
  "workOrderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_tx_date ON public.inventory_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_branch ON public.inventory_transactions("branchId");
CREATE INDEX IF NOT EXISTS idx_inventory_tx_part ON public.inventory_transactions("partId");
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON public.inventory_transactions(type);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_transactions
-- NOTE: Using simple policies (allow all authenticated users) to avoid dependency on custom RLS functions
-- You can enhance these policies later by adding branch-based or role-based restrictions
DROP POLICY IF EXISTS inv_tx_select ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_insert ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_update ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_delete ON public.inventory_transactions;

-- Simple RLS: Allow all authenticated users (you can customize later)
CREATE POLICY inv_tx_select ON public.inventory_transactions 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY inv_tx_insert ON public.inventory_transactions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY inv_tx_update ON public.inventory_transactions 
  FOR UPDATE TO authenticated 
  USING (true)
  WITH CHECK (true);

CREATE POLICY inv_tx_delete ON public.inventory_transactions 
  FOR DELETE TO authenticated 
  USING (true);

-- 1. Fix adjust_part_stock function signature
CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
  v_delta_int INT;
BEGIN
  v_delta_int := p_delta::INT;
  
  SELECT COALESCE((stock->>p_branch_id)::int, 0) INTO v_current
  FROM public.parts
  WHERE id = p_part_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PART_NOT_FOUND';
  END IF;

  UPDATE public.parts
  SET stock = jsonb_set(stock, ARRAY[p_branch_id], to_jsonb(GREATEST(0, v_current + v_delta_int)), true)
  WHERE id = p_part_id;
END;
$$;

-- 2. Ensure inventory_tx_after_insert trigger function exists
CREATE OR REPLACE FUNCTION public.inventory_tx_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.type = 'Nhập kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", NEW.quantity);
  ELSIF NEW.type = 'Xuất kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", -NEW.quantity);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions;

CREATE TRIGGER trg_inventory_tx_after_insert
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION public.inventory_tx_after_insert();

-- 4. Verify setup
DO $$
BEGIN
  -- Check table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
  ) THEN
    RAISE NOTICE '✅ Table inventory_transactions exists';
  ELSE
    RAISE WARNING '❌ Table inventory_transactions does not exist';
  END IF;

  -- Check function exists with correct signature
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'adjust_part_stock' 
    AND pg_get_function_arguments(oid) LIKE '%numeric%'
  ) THEN
    RAISE NOTICE '✅ Function adjust_part_stock signature is correct';
  ELSE
    RAISE WARNING '❌ Function adjust_part_stock signature is incorrect';
  END IF;

  -- Check trigger exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_inventory_tx_after_insert'
  ) THEN
    RAISE NOTICE '✅ Trigger trg_inventory_tx_after_insert exists';
  ELSE
    RAISE WARNING '❌ Trigger trg_inventory_tx_after_insert does not exist';
  END IF;

  RAISE NOTICE '🎉 Setup complete! Ready to test inventory operations.';
END $$;
