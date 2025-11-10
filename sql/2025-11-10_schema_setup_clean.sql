-- Clean base schema setup (idempotent): tables + indexes only
-- Run RLS policy scripts separately after this.

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts
CREATE TABLE IF NOT EXISTS public.parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  stock JSONB DEFAULT '{}'::jsonb,
  retailPrice JSONB DEFAULT '{}'::jsonb,
  wholesalePrice JSONB DEFAULT '{}'::jsonb,
  category TEXT,
  description TEXT,
  warrantyPeriod TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  creationDate TIMESTAMPTZ NOT NULL,
  customerName TEXT NOT NULL,
  customerPhone TEXT,
  vehicleModel TEXT,
  licensePlate TEXT,
  issueDescription TEXT,
  technicianName TEXT,
  status TEXT NOT NULL DEFAULT 'Tiếp nhận',
  laborCost NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  partsUsed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  total NUMERIC DEFAULT 0,
  branchId TEXT NOT NULL,
  -- deposit
  depositAmount NUMERIC,
  depositDate TIMESTAMPTZ,
  depositTransactionId TEXT,
  -- payments
  paymentStatus TEXT DEFAULT 'unpaid',
  paymentMethod TEXT,
  additionalPayment NUMERIC,
  totalPaid NUMERIC,
  remainingAmount NUMERIC,
  paymentDate TIMESTAMPTZ,
  cashTransactionId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb,
  paymentMethod TEXT NOT NULL,
  userId TEXT NOT NULL,
  costPrice JSONB DEFAULT '{}'::jsonb,
  vatRate NUMERIC,
  branchId TEXT NOT NULL,
  cashTransactionId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (normalized)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Transactions
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  branchId TEXT NOT NULL,
  paymentSource TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Sources
CREATE TABLE IF NOT EXISTS public.payment_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  balance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  partId TEXT NOT NULL,
  partName TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  unitPrice NUMERIC,
  totalPrice NUMERIC NOT NULL,
  branchId TEXT NOT NULL,
  notes TEXT,
  saleId TEXT,
  workOrderId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON public.parts(sku);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_branchId ON public.work_orders(branchId);
CREATE INDEX IF NOT EXISTS idx_work_orders_date ON public.work_orders(creationDate DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_branchId ON public.sales(branchId);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_branchId ON public.cash_transactions(branchId);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON public.inventory_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default payment sources (idempotent)
INSERT INTO public.payment_sources (id, name, balance)
VALUES ('cash','Tiền mặt','{"CN1":0}'), ('bank','Chuyển khoản','{"CN1":0}')
ON CONFLICT (id) DO NOTHING;
