-- Check store_settings data
SELECT id, store_name, phone, address, email, logo_url, bank_qr_url, bank_name, bank_account_number
FROM store_settings
ORDER BY created_at DESC;

-- Count rows
SELECT COUNT(*) as total_rows FROM store_settings;
