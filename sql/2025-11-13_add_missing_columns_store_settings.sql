-- Add missing columns to store_settings table
-- This adds all columns needed for the settings page

DO $$ 
BEGIN
    -- Add store_name if not exists (required field)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='store_name'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN store_name TEXT NOT NULL DEFAULT 'Cửa hàng';
        COMMENT ON COLUMN store_settings.store_name IS 'Tên cửa hàng';
    END IF;

    -- Add store_name_en if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='store_name_en'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN store_name_en TEXT;
        COMMENT ON COLUMN store_settings.store_name_en IS 'Tên cửa hàng (tiếng Anh)';
    END IF;

    -- Add slogan if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='slogan'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN slogan TEXT;
        COMMENT ON COLUMN store_settings.slogan IS 'Slogan của cửa hàng';
    END IF;

    -- Add address if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='address'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN address TEXT;
        COMMENT ON COLUMN store_settings.address IS 'Địa chỉ cửa hàng';
    END IF;

    -- Add phone if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='phone'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN phone TEXT;
        COMMENT ON COLUMN store_settings.phone IS 'Số điện thoại';
    END IF;

    -- Add email if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='email'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN email TEXT;
        COMMENT ON COLUMN store_settings.email IS 'Email liên hệ';
    END IF;

    -- Add website if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='website'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN website TEXT;
        COMMENT ON COLUMN store_settings.website IS 'Website';
    END IF;

    -- Add tax_code if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='tax_code'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN tax_code TEXT;
        COMMENT ON COLUMN store_settings.tax_code IS 'Mã số thuế';
    END IF;

    -- Add logo_url if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='logo_url'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN logo_url TEXT;
        COMMENT ON COLUMN store_settings.logo_url IS 'URL logo cửa hàng';
    END IF;

    -- Add business_hours if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='business_hours'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN business_hours TEXT;
        COMMENT ON COLUMN store_settings.business_hours IS 'Giờ mở cửa của cửa hàng';
    END IF;

    -- Add established_year if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='established_year'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN established_year INTEGER;
        COMMENT ON COLUMN store_settings.established_year IS 'Năm thành lập';
    END IF;

    -- Add bank_qr_url if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='bank_qr_url'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN bank_qr_url TEXT;
        COMMENT ON COLUMN store_settings.bank_qr_url IS 'URL của mã QR ngân hàng';
    END IF;

    -- Add primary_color if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='primary_color'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN primary_color TEXT DEFAULT '#3B82F6';
        COMMENT ON COLUMN store_settings.primary_color IS 'Màu chủ đạo của giao diện';
    END IF;

    -- Add bank_name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='bank_name'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN bank_name TEXT;
        COMMENT ON COLUMN store_settings.bank_name IS 'Tên ngân hàng';
    END IF;

    -- Add bank_account_number if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='bank_account_number'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN bank_account_number TEXT;
        COMMENT ON COLUMN store_settings.bank_account_number IS 'Số tài khoản ngân hàng';
    END IF;

    -- Add bank_account_holder if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='bank_account_holder'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN bank_account_holder TEXT;
        COMMENT ON COLUMN store_settings.bank_account_holder IS 'Chủ tài khoản ngân hàng';
    END IF;

    -- Add bank_branch if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='bank_branch'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN bank_branch TEXT;
        COMMENT ON COLUMN store_settings.bank_branch IS 'Chi nhánh ngân hàng';
    END IF;

    -- Add invoice_prefix if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='invoice_prefix'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN invoice_prefix TEXT DEFAULT 'HD';
        COMMENT ON COLUMN store_settings.invoice_prefix IS 'Mã tiền tố hóa đơn';
    END IF;

    -- Add receipt_prefix if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='receipt_prefix'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN receipt_prefix TEXT DEFAULT 'PN';
        COMMENT ON COLUMN store_settings.receipt_prefix IS 'Mã tiền tố phiếu nhập';
    END IF;

    -- Add work_order_prefix if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='work_order_prefix'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN work_order_prefix TEXT DEFAULT 'SC';
        COMMENT ON COLUMN store_settings.work_order_prefix IS 'Mã tiền tố phiếu sửa chữa';
    END IF;

    -- Add invoice_footer_note if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='invoice_footer_note'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN invoice_footer_note TEXT;
        COMMENT ON COLUMN store_settings.invoice_footer_note IS 'Ghi chú cuối hóa đơn';
    END IF;

    -- Add currency if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='currency'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN currency TEXT DEFAULT 'VND';
        COMMENT ON COLUMN store_settings.currency IS 'Đơn vị tiền tệ';
    END IF;

    -- Add date_format if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='date_format'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN date_format TEXT DEFAULT 'DD/MM/YYYY';
        COMMENT ON COLUMN store_settings.date_format IS 'Định dạng ngày tháng';
    END IF;

    -- Add timezone if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' AND column_name='timezone'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh';
        COMMENT ON COLUMN store_settings.timezone IS 'Múi giờ';
    END IF;

END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'store_settings'
ORDER BY ordinal_position;
