-- Fix column names in inventory_transactions table to use quoted camelCase
-- This ensures the database matches the TypeScript code expectations

-- First, check if columns exist in lowercase (they likely do)
DO $$
BEGIN
  -- Rename columns from lowercase to camelCase
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'partid') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN partid TO "partId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'partname') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN partname TO "partName";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'unitprice') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN unitprice TO "unitPrice";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'totalprice') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN totalprice TO "totalPrice";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'branchid') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN branchid TO "branchId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'saleid') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN saleid TO "saleId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_transactions' AND column_name = 'workorderid') THEN
    ALTER TABLE public.inventory_transactions RENAME COLUMN workorderid TO "workOrderId";
  END IF;
END$$;

-- Fix parts table columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'parts' AND column_name = 'retailprice') THEN
    ALTER TABLE public.parts RENAME COLUMN retailprice TO "retailPrice";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'parts' AND column_name = 'wholesaleprice') THEN
    ALTER TABLE public.parts RENAME COLUMN wholesaleprice TO "wholesalePrice";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'parts' AND column_name = 'warrantyperiod') THEN
    ALTER TABLE public.parts RENAME COLUMN warrantyperiod TO "warrantyPeriod";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'parts' AND column_name = 'costprice') THEN
    ALTER TABLE public.parts RENAME COLUMN costprice TO "costPrice";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'parts' AND column_name = 'vatrate') THEN
    ALTER TABLE public.parts RENAME COLUMN vatrate TO "vatRate";
  END IF;
END$$;
