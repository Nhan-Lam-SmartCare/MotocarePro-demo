-- TIM VA XOA MOI TRIGGER - PHUONG AN CUOI CUNG

-- Buoc 1: Tim tat ca trigger tren inventory_transactions
SELECT 
  t.tgname as trigger_name,
  'DROP TRIGGER ' || t.tgname || ' ON public.inventory_transactions CASCADE;' as drop_command
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'inventory_transactions'
  AND c.relnamespace = 'public'::regnamespace
  AND t.tgisinternal = false;

-- Buoc 2: XOA TAT CA (chay tung dong DROP TRIGGER o tren neu co)
-- Hoac chay script nay:

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'inventory_transactions'
      AND c.relnamespace = 'public'::regnamespace
      AND t.tgisinternal = false
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(rec.tgname) || ' ON public.inventory_transactions CASCADE';
    RAISE NOTICE 'Dropped trigger: %', rec.tgname;
  END LOOP;
END $$;

-- Buoc 3: Xoa tat ca function
DROP FUNCTION IF EXISTS public.inventory_tx_after_insert() CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_part_stock(TEXT, TEXT, BIGINT) CASCADE;

-- Buoc 4: XOA CA BANG VA TAO LAI
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;

CREATE TABLE public.inventory_transactions (
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

CREATE INDEX idx_inventory_tx_date ON public.inventory_transactions(date DESC);
CREATE INDEX idx_inventory_tx_branch ON public.inventory_transactions("branchId");
CREATE INDEX idx_inventory_tx_part ON public.inventory_transactions("partId");
CREATE INDEX idx_inventory_tx_type ON public.inventory_transactions(type);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inv_tx_select ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_insert ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_update ON public.inventory_transactions;
DROP POLICY IF EXISTS inv_tx_delete ON public.inventory_transactions;

CREATE POLICY inv_tx_select ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY inv_tx_insert ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY inv_tx_update ON public.inventory_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY inv_tx_delete ON public.inventory_transactions FOR DELETE TO authenticated USING (true);

-- Buoc 5: Verify
SELECT 'Table created: ' || tablename FROM pg_tables WHERE tablename = 'inventory_transactions';
SELECT 'Trigger count: ' || COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'inventory_transactions' AND t.tgisinternal = false;
