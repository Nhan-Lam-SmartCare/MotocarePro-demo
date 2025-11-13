-- Add bank_qr_url column to store_settings table
-- This will store the URL of the bank QR code image for payment

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='store_settings' 
        AND column_name='bank_qr_url'
    ) THEN
        ALTER TABLE store_settings 
        ADD COLUMN bank_qr_url TEXT;
        
        COMMENT ON COLUMN store_settings.bank_qr_url IS 'URL của mã QR ngân hàng để khách hàng thanh toán';
    END IF;
END $$;

-- Create storage bucket if not exists for public assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public-assets bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access to public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete public-assets" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public Access to public-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload public-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update public-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete public-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');
