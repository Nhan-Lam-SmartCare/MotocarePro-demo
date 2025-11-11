-- Kiểm tra tên cột trong bảng inventory_transactions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'inventory_transactions'
ORDER BY ordinal_position;

-- Kiểm tra xem có dữ liệu không
SELECT COUNT(*) as total_records FROM public.inventory_transactions;

-- Xem dữ liệu mẫu (nếu có)
SELECT * FROM public.inventory_transactions ORDER BY created_at DESC LIMIT 5;
