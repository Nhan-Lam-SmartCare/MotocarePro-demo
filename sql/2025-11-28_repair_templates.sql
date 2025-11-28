-- ============================================
-- Repair Templates Table
-- Bảng lưu trữ mẫu sửa chữa
-- ============================================

-- Tạo bảng repair_templates
CREATE TABLE IF NOT EXISTS repair_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID, -- Không có foreign key vì branches có thể không tồn tại
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 30, -- Thời gian ước tính (phút)
  labor_cost NUMERIC DEFAULT 0, -- Chi phí công
  parts JSONB DEFAULT '[]'::jsonb, -- Danh sách phụ tùng [{ name, quantity, price, unit }]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Index cho tìm kiếm
CREATE INDEX IF NOT EXISTS idx_repair_templates_branch ON repair_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_repair_templates_name ON repair_templates(name);
CREATE INDEX IF NOT EXISTS idx_repair_templates_active ON repair_templates(is_active);

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_repair_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS repair_templates_updated_at ON repair_templates;
CREATE TRIGGER repair_templates_updated_at
  BEFORE UPDATE ON repair_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_repair_templates_updated_at();

-- RLS Policies
ALTER TABLE repair_templates ENABLE ROW LEVEL SECURITY;

-- Policy đơn giản: Cho phép tất cả authenticated users truy cập
CREATE POLICY "repair_templates_select" ON repair_templates
  FOR SELECT USING (true);

CREATE POLICY "repair_templates_insert" ON repair_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "repair_templates_update" ON repair_templates
  FOR UPDATE USING (true);

CREATE POLICY "repair_templates_delete" ON repair_templates
  FOR DELETE USING (true);

-- Seed data: Thêm các mẫu mặc định (global templates)
INSERT INTO repair_templates (id, branch_id, name, description, duration, labor_cost, parts, is_active)
VALUES 
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    NULL,
    'Thay dầu động cơ',
    'Thay dầu và lọc dầu động cơ',
    30,
    300000,
    '[{"name": "Dầu động cơ 10W40", "quantity": 1, "price": 120000, "unit": "chai"}, {"name": "Lọc dầu", "quantity": 1, "price": 30000, "unit": "cái"}]'::jsonb,
    true
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    NULL,
    'Sửa phanh',
    'Thay má phanh và bảo dưỡng hệ thống phanh',
    45,
    505000,
    '[{"name": "Má phanh trước", "quantity": 2, "price": 160000, "unit": "cái"}, {"name": "Má phanh sau", "quantity": 2, "price": 120000, "unit": "cái"}, {"name": "Dầu phanh", "quantity": 1, "price": 25000, "unit": "chai"}]'::jsonb,
    true
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    NULL,
    'Vệ sinh kim phun',
    'Vệ sinh và hiệu chỉnh kim phun xăng',
    60,
    150000,
    '[{"name": "Dung dịch vệ sinh kim phun", "quantity": 1, "price": 50000, "unit": "chai"}]'::jsonb,
    true
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004',
    NULL,
    'Thay nhớt hộp số',
    'Thay nhớt hộp số xe tay ga',
    20,
    50000,
    '[{"name": "Nhớt hộp số", "quantity": 1, "price": 45000, "unit": "chai"}]'::jsonb,
    true
  ),
  (
    'a1b2c3d4-0005-4000-8000-000000000005',
    NULL,
    'Thay bugi',
    'Thay bugi và kiểm tra hệ thống đánh lửa',
    15,
    35000,
    '[{"name": "Bugi NGK", "quantity": 1, "price": 35000, "unit": "cái"}]'::jsonb,
    true
  ),
  (
    'a1b2c3d4-0006-4000-8000-000000000006',
    NULL,
    'Thay lọc gió',
    'Thay lọc gió động cơ',
    15,
    25000,
    '[{"name": "Lọc gió", "quantity": 1, "price": 35000, "unit": "cái"}]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Comment
COMMENT ON TABLE repair_templates IS 'Bảng lưu trữ mẫu sửa chữa thường dùng';
COMMENT ON COLUMN repair_templates.branch_id IS 'NULL = mẫu toàn hệ thống, có giá trị = mẫu riêng của chi nhánh';
COMMENT ON COLUMN repair_templates.parts IS 'JSON array: [{ name, quantity, price, unit }]';
