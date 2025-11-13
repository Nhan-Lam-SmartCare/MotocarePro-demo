-- Add additionalServices column to work_orders table
-- This column stores additional service items beyond parts (e.g., labor, inspections)

DO $$ 
BEGIN
  -- Add additionalServices column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'work_orders' 
    AND column_name = 'additionalservices'
  ) THEN
    ALTER TABLE public.work_orders 
    ADD COLUMN additionalServices JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Added additionalServices column to work_orders table';
  ELSE
    RAISE NOTICE 'additionalServices column already exists in work_orders table';
  END IF;
END $$;
