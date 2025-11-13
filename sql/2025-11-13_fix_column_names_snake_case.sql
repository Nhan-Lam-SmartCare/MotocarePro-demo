-- Fix: Use lowercase column names (PostgreSQL convention)
DO $$ 
BEGIN
  -- Drop columns with camelCase if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundedAt') THEN
    ALTER TABLE work_orders DROP COLUMN "refundedAt";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundTransactionId') THEN
    ALTER TABLE work_orders DROP COLUMN "refundTransactionId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundReason') THEN
    ALTER TABLE work_orders DROP COLUMN "refundReason";
  END IF;
  
  -- Add columns with snake_case (standard PostgreSQL naming)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refunded_at') THEN
    ALTER TABLE work_orders ADD COLUMN refunded_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refund_transaction_id') THEN
    ALTER TABLE work_orders ADD COLUMN refund_transaction_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refund_reason') THEN
    ALTER TABLE work_orders ADD COLUMN refund_reason TEXT;
  END IF;
END $$;

COMMENT ON COLUMN work_orders.refunded IS 'True if work order has been refunded/cancelled';
COMMENT ON COLUMN work_orders.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN work_orders.refund_transaction_id IS 'Reference to cash transaction for refund';
COMMENT ON COLUMN work_orders.refund_reason IS 'Reason for refund';
