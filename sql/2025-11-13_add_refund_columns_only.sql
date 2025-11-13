-- Quick fix: Add missing columns to work_orders table if not exists
-- Using snake_case to match PostgreSQL convention

DO $$ 
BEGIN
  -- Add refunded column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'refunded'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN refunded BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add refunded_at column (snake_case)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN refunded_at TIMESTAMP;
  END IF;

  -- Add refund_transaction_id column (snake_case)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'refund_transaction_id'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN refund_transaction_id TEXT;
  END IF;

  -- Add refund_reason column (snake_case)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'refund_reason'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN refund_reason TEXT;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN work_orders.refunded IS 'True if work order has been refunded/cancelled';
COMMENT ON COLUMN work_orders.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN work_orders.refund_transaction_id IS 'Reference to cash transaction for refund';
COMMENT ON COLUMN work_orders.refund_reason IS 'Reason for refund';
