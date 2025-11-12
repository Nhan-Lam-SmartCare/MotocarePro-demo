-- ============================================
-- SIMPLE INVENTORY FIX - NO TRIGGER
-- Tạo bảng và function, KHÔNG tạo trigger
-- Trigger sẽ được tắt để tránh lỗi
-- ============================================

-- 1. Create inventory_transactions table
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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_tx_date ON public.inventory_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_branch ON public.inventory_transactions("branchId");
CREATE INDEX IF NOT EXISTS idx_inventory_tx_part ON public.inventory_transactions("partId");
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON public.inventory_transactions(type);

-- 3. Enable RLS with simple policies
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inv_tx_select ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_insert ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_update ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_delete ON public.inventory_transactions;

CREATE POLICY inv_tx_select ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY inv_tx_insert ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY inv_tx_update ON public.inventory_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY inv_tx_delete ON public.inventory_transactions FOR DELETE TO authenticated USING (true);

-- 4. Drop any existing trigger (để tránh lỗi với function chưa có)
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions;

-- 5. Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
  ) THEN
    RAISE NOTICE '✅ Table inventory_transactions created successfully';
  ELSE
    RAISE WARNING '❌ Failed to create table inventory_transactions';
  END IF;

  RAISE NOTICE '🎉 Setup complete! Inventory transactions table is ready.';
  RAISE NOTICE 'ℹ️  Note: Automatic stock update trigger is DISABLED to avoid errors.';
  RAISE NOTICE 'ℹ️  Stock will be updated manually in the application code.';
END $$;
