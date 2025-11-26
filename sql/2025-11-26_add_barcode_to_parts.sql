-- =============================================================================
-- Migration: Add barcode column to parts table
-- Date: 2025-11-26
-- Description: Thêm field barcode để lưu mã vạch của hãng (Honda, Yamaha...)
--              Ví dụ: Honda: 06455-KYJ-841, Yamaha: 5S9-F2101-00
-- =============================================================================

-- Add barcode column to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create index for fast barcode lookup
CREATE INDEX IF NOT EXISTS idx_parts_barcode ON parts(barcode);

-- Comment for documentation
COMMENT ON COLUMN parts.barcode IS 'Mã vạch của hãng (Honda: 06455-KYJ-841, Yamaha: 5S9-F2101-00). Khác với SKU nội bộ.';
