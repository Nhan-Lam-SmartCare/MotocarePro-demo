-- Migration: Normalize cash_transactions for app usage
-- Date: 2025-11-10

-- Add missing/normalized columns to cash_transactions
ALTER TABLE cash_transactions
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS paymentSourceId TEXT,
  ADD COLUMN IF NOT EXISTS recipient TEXT,
  ADD COLUMN IF NOT EXISTS saleId TEXT,
  ADD COLUMN IF NOT EXISTS workOrderId TEXT,
  ADD COLUMN IF NOT EXISTS payrollRecordId TEXT,
  ADD COLUMN IF NOT EXISTS loanPaymentId TEXT,
  ADD COLUMN IF NOT EXISTS supplierId TEXT,
  ADD COLUMN IF NOT EXISTS customerId TEXT;

-- Constrain type to allowed values if column exists (income/expense)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_transactions' AND column_name = 'type'
  ) THEN
    -- Create a check constraint if not exists
    BEGIN
      ALTER TABLE cash_transactions
        ADD CONSTRAINT cash_transactions_type_check CHECK (type IN ('income','expense'));
    EXCEPTION WHEN duplicate_object THEN
      -- constraint already exists
      NULL;
    END;
  END IF;
END $$;

-- Ensure helpful indexes
CREATE INDEX IF NOT EXISTS idx_cash_tx_date ON cash_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_tx_branch ON cash_transactions(branchId);

-- Inventory transactions: ensure date index exists
CREATE INDEX IF NOT EXISTS idx_inventory_tx_date ON inventory_transactions(date DESC);
