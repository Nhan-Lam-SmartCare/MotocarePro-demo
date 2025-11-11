-- Sửa RLS policy cho inventory_transactions để cho phép INSERT
-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS inv_tx_insert ON public.inventory_transactions;

-- Tạo policy mới: cho phép authenticated user INSERT
CREATE POLICY inv_tx_insert ON public.inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Đảm bảo RLS được bật
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
