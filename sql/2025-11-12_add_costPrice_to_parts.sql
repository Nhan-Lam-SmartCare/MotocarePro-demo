-- ============================================
-- ADD costPrice COLUMN TO parts TABLE
-- Them truong gia nhap cho phu tung
-- ============================================

-- Add costPrice column (JSONB for multi-branch support)
ALTER TABLE public.parts 
ADD COLUMN IF NOT EXISTS "costPrice" JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.parts."costPrice" IS 'Gia nhap cua phu tung theo chi nhanh (branch-mapped)';

-- Create index for better performance when querying costPrice
CREATE INDEX IF NOT EXISTS idx_parts_costprice ON public.parts USING gin("costPrice");

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'parts' 
      AND column_name = 'costPrice'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Column costPrice added to parts table';
  ELSE
    RAISE WARNING '❌ FAILED: Could not add costPrice column';
  END IF;
END $$;
