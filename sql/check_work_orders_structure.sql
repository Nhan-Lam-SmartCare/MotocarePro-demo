-- Check work_orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'work_orders'
ORDER BY ordinal_position;

-- Check if columns exist
SELECT 
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refunded') as has_refunded,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundedAt') as has_refundedAt,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundTransactionId') as has_refundTransactionId,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'refundReason') as has_refundReason;

-- Test query
SELECT * FROM work_orders LIMIT 1;
