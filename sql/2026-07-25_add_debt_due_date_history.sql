-- Bổ sung các cột cho màn hình Quản lý Công Nợ (dark UI mới):
--   * due_date        : ngày hẹn trả phần còn lại (dùng cho bộ lọc Quá hạn / Sắp đến hạn)
--   * payment_history : lịch sử các đợt thu/trả nợ (modal Lịch sử thanh toán)
--   * staff_id / staff_name : nhân viên tạo hoặc thu khoản nợ
--   * vehicle_model   : dòng xe của khách (chỉ customer_debts)
--   * phone           : SĐT nhà cung cấp (chỉ supplier_debts)

-- ===== customer_debts =====
ALTER TABLE customer_debts
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS payment_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS staff_id TEXT,
  ADD COLUMN IF NOT EXISTS staff_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

-- ===== supplier_debts =====
ALTER TABLE supplier_debts
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS payment_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS staff_id TEXT,
  ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Index phục vụ bộ lọc quá hạn / sắp đến hạn
CREATE INDEX IF NOT EXISTS idx_customer_debts_due_date ON customer_debts(due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_debts_due_date ON supplier_debts(due_date);

COMMENT ON COLUMN customer_debts.payment_history IS 'Danh sách đợt thu nợ: [{date, amount, method, note, staffName}]';
COMMENT ON COLUMN supplier_debts.payment_history IS 'Danh sách đợt trả nợ: [{date, amount, method, note, staffName}]';
