-- Migration: Capital Management (Quản lý vốn đầu tư)
-- Date: 2025-11-24
-- Description: Tạo bảng quản lý vốn chủ sở hữu, vốn đầu tư và vốn vay

-- =============================================
-- 1. CREATE TABLE: capital
-- =============================================
CREATE TABLE IF NOT EXISTS capital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('owner', 'investor', 'loan')),
  source_name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  -- Interest information (for investor and loan types)
  interest_rate NUMERIC(5, 2), -- Lãi suất %/năm
  interest_type TEXT CHECK (interest_type IN ('simple', 'compound')), -- Lãi đơn/Lãi kép
  payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly')), -- Kỳ trả lãi
  maturity_date TIMESTAMPTZ, -- Ngày đến hạn
  
  branch_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_capital_branch ON capital(branch_id);
CREATE INDEX IF NOT EXISTS idx_capital_type ON capital(type);
CREATE INDEX IF NOT EXISTS idx_capital_date ON capital(date);
CREATE INDEX IF NOT EXISTS idx_capital_maturity_date ON capital(maturity_date) WHERE maturity_date IS NOT NULL;

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE capital ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Policy: Owner và Manager có thể xem tất cả
CREATE POLICY "capital_select_policy" ON capital
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Owner và Manager có thể thêm
CREATE POLICY "capital_insert_policy" ON capital
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Owner và Manager có thể cập nhật
CREATE POLICY "capital_update_policy" ON capital
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Chỉ Owner có thể xóa
CREATE POLICY "capital_delete_policy" ON capital
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );

-- =============================================
-- 5. CREATE TRIGGER FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_capital_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capital_updated_at_trigger
  BEFORE UPDATE ON capital
  FOR EACH ROW
  EXECUTE FUNCTION update_capital_updated_at();

-- =============================================
-- 6. CREATE VIEW: Capital Summary by Type
-- =============================================
CREATE OR REPLACE VIEW capital_summary AS
SELECT 
  branch_id,
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(interest_rate) as avg_interest_rate
FROM capital
GROUP BY branch_id, type;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================
GRANT SELECT ON capital TO authenticated;
GRANT INSERT ON capital TO authenticated;
GRANT UPDATE ON capital TO authenticated;
GRANT DELETE ON capital TO authenticated;
GRANT SELECT ON capital_summary TO authenticated;

-- =============================================
-- 8. COMMENTS
-- =============================================
COMMENT ON TABLE capital IS 'Quản lý vốn đầu tư: vốn chủ sở hữu, vốn đầu tư, vốn vay';
COMMENT ON COLUMN capital.type IS 'Loại vốn: owner (vốn chủ), investor (đầu tư), loan (vay)';
COMMENT ON COLUMN capital.source_name IS 'Tên nguồn vốn';
COMMENT ON COLUMN capital.amount IS 'Số tiền vốn';
COMMENT ON COLUMN capital.interest_rate IS 'Lãi suất %/năm (áp dụng cho investor và loan)';
COMMENT ON COLUMN capital.interest_type IS 'Loại lãi: simple (lãi đơn), compound (lãi kép)';
COMMENT ON COLUMN capital.payment_frequency IS 'Kỳ trả lãi: monthly, quarterly, yearly';
COMMENT ON COLUMN capital.maturity_date IS 'Ngày đến hạn';
