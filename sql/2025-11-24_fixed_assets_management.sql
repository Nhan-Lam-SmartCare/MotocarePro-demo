-- Migration: Fixed Assets Management (Quản lý tài sản cố định)
-- Date: 2025-11-24
-- Description: Tạo bảng quản lý tài sản cố định và khấu hao

-- =============================================
-- 1. CREATE TABLE: fixed_assets
-- =============================================
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('equipment', 'vehicle', 'building', 'furniture', 'other')),
  purchase_date TIMESTAMPTZ NOT NULL,
  purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  depreciation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0, -- %/năm
  depreciation_method TEXT NOT NULL DEFAULT 'straight-line' CHECK (depreciation_method IN ('straight-line', 'declining-balance')),
  useful_life NUMERIC(5, 2) NOT NULL DEFAULT 5, -- Số năm
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'maintenance')),
  
  -- Additional information
  location TEXT,
  serial_number TEXT,
  supplier TEXT,
  warranty TIMESTAMPTZ, -- Ngày hết bảo hành
  notes TEXT,
  
  branch_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- =============================================
-- 2. CREATE TABLE: fixed_asset_depreciation
-- =============================================
CREATE TABLE IF NOT EXISTS fixed_asset_depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  depreciation_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  book_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(asset_id, year, month)
);

-- =============================================
-- 3. CREATE INDEXES
-- =============================================
-- Fixed Assets
CREATE INDEX IF NOT EXISTS idx_fixed_assets_branch ON fixed_assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_type ON fixed_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_purchase_date ON fixed_assets(purchase_date);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_serial ON fixed_assets(serial_number) WHERE serial_number IS NOT NULL;

-- Depreciation
CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON fixed_asset_depreciation(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_year_month ON fixed_asset_depreciation(year, month);

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_asset_depreciation ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. CREATE RLS POLICIES - fixed_assets
-- =============================================

-- Policy: Owner và Manager có thể xem tất cả
CREATE POLICY "fixed_assets_select_policy" ON fixed_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Owner và Manager có thể thêm
CREATE POLICY "fixed_assets_insert_policy" ON fixed_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Owner và Manager có thể cập nhật
CREATE POLICY "fixed_assets_update_policy" ON fixed_assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Chỉ Owner có thể xóa
CREATE POLICY "fixed_assets_delete_policy" ON fixed_assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );

-- =============================================
-- 6. CREATE RLS POLICIES - fixed_asset_depreciation
-- =============================================

-- Policy: Owner và Manager có thể xem
CREATE POLICY "depreciation_select_policy" ON fixed_asset_depreciation
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- Policy: Owner và Manager có thể thêm
CREATE POLICY "depreciation_insert_policy" ON fixed_asset_depreciation
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'manager')
    )
  );

-- =============================================
-- 7. CREATE TRIGGERS
-- =============================================

-- Trigger: Update updated_at for fixed_assets
CREATE OR REPLACE FUNCTION update_fixed_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fixed_assets_updated_at_trigger
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_fixed_assets_updated_at();

-- Trigger: Auto calculate depreciation when asset is created/updated
CREATE OR REPLACE FUNCTION calculate_asset_depreciation()
RETURNS TRIGGER AS $$
DECLARE
  years_passed NUMERIC;
  annual_depreciation NUMERIC;
  total_depreciation NUMERIC;
BEGIN
  -- Calculate years passed since purchase
  years_passed := EXTRACT(EPOCH FROM (NOW() - NEW.purchase_date)) / (365.25 * 24 * 60 * 60);
  
  -- Calculate depreciation based on method
  IF NEW.depreciation_method = 'straight-line' THEN
    -- Straight-line depreciation
    annual_depreciation := (NEW.purchase_price * NEW.depreciation_rate / 100);
    total_depreciation := LEAST(annual_depreciation * years_passed, NEW.purchase_price);
  ELSE
    -- Declining balance depreciation (simplified)
    total_depreciation := NEW.purchase_price * (1 - POWER(1 - NEW.depreciation_rate / 100, years_passed));
  END IF;
  
  -- Update current value
  NEW.current_value := GREATEST(0, NEW.purchase_price - total_depreciation);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_depreciation_trigger
  BEFORE INSERT OR UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_asset_depreciation();

-- =============================================
-- 8. CREATE VIEWS
-- =============================================

-- View: Assets Summary by Type
CREATE OR REPLACE VIEW fixed_assets_summary AS
SELECT 
  branch_id,
  asset_type,
  status,
  COUNT(*) as count,
  SUM(purchase_price) as total_purchase_price,
  SUM(current_value) as total_current_value,
  SUM(purchase_price - current_value) as total_depreciation
FROM fixed_assets
GROUP BY branch_id, asset_type, status;

-- View: Assets with Depreciation Details
CREATE OR REPLACE VIEW fixed_assets_with_depreciation AS
SELECT 
  fa.*,
  (fa.purchase_price - fa.current_value) as accumulated_depreciation,
  CASE 
    WHEN fa.purchase_price > 0 
    THEN ROUND(((fa.purchase_price - fa.current_value) / fa.purchase_price * 100)::NUMERIC, 2)
    ELSE 0 
  END as depreciation_percentage,
  EXTRACT(YEAR FROM AGE(NOW(), fa.purchase_date)) as age_years
FROM fixed_assets fa;

-- =============================================
-- 9. CREATE FUNCTION: Calculate Monthly Depreciation
-- =============================================
CREATE OR REPLACE FUNCTION calculate_monthly_depreciation(
  p_asset_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  depreciation_amount NUMERIC,
  accumulated_depreciation NUMERIC,
  book_value NUMERIC
) AS $$
DECLARE
  v_asset RECORD;
  v_monthly_depreciation NUMERIC;
  v_accumulated NUMERIC;
BEGIN
  -- Get asset details
  SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;
  
  -- Calculate monthly depreciation (straight-line)
  v_monthly_depreciation := (v_asset.purchase_price * v_asset.depreciation_rate / 100) / 12;
  
  -- Get accumulated depreciation up to this month
  SELECT COALESCE(SUM(fa.depreciation_amount), 0) INTO v_accumulated
  FROM fixed_asset_depreciation fa
  WHERE fa.asset_id = p_asset_id
  AND (fa.year < p_year OR (fa.year = p_year AND fa.month < p_month));
  
  v_accumulated := v_accumulated + v_monthly_depreciation;
  
  RETURN QUERY SELECT 
    v_monthly_depreciation,
    v_accumulated,
    GREATEST(0, v_asset.purchase_price - v_accumulated);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. GRANT PERMISSIONS
-- =============================================
GRANT SELECT ON fixed_assets TO authenticated;
GRANT INSERT ON fixed_assets TO authenticated;
GRANT UPDATE ON fixed_assets TO authenticated;
GRANT DELETE ON fixed_assets TO authenticated;

GRANT SELECT ON fixed_asset_depreciation TO authenticated;
GRANT INSERT ON fixed_asset_depreciation TO authenticated;

GRANT SELECT ON fixed_assets_summary TO authenticated;
GRANT SELECT ON fixed_assets_with_depreciation TO authenticated;

-- =============================================
-- 11. COMMENTS
-- =============================================
COMMENT ON TABLE fixed_assets IS 'Quản lý tài sản cố định của doanh nghiệp';
COMMENT ON COLUMN fixed_assets.asset_type IS 'Loại tài sản: equipment, vehicle, building, furniture, other';
COMMENT ON COLUMN fixed_assets.depreciation_rate IS 'Tỷ lệ khấu hao %/năm';
COMMENT ON COLUMN fixed_assets.depreciation_method IS 'Phương pháp khấu hao: straight-line (đường thẳng), declining-balance (số dư giảm dần)';
COMMENT ON COLUMN fixed_assets.useful_life IS 'Thời gian sử dụng hữu ích (năm)';
COMMENT ON COLUMN fixed_assets.status IS 'Trạng thái: active (đang dùng), disposed (đã thanh lý), maintenance (bảo trì)';

COMMENT ON TABLE fixed_asset_depreciation IS 'Lịch sử khấu hao tài sản cố định theo tháng';
COMMENT ON COLUMN fixed_asset_depreciation.depreciation_amount IS 'Số tiền khấu hao trong tháng';
COMMENT ON COLUMN fixed_asset_depreciation.accumulated_depreciation IS 'Khấu hao lũy kế đến thời điểm hiện tại';
COMMENT ON COLUMN fixed_asset_depreciation.book_value IS 'Giá trị còn lại (giá trị sổ sách)';
