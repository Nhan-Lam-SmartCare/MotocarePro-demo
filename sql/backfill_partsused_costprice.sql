-- Script: Backfill costPrice cho các phiếu sửa chữa cũ
-- Chạy trên Supabase Dashboard > SQL Editor

-- Function để backfill costPrice
CREATE OR REPLACE FUNCTION backfill_partsused_costprice()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wo_record RECORD;
  part_record RECORD;
  updated_parts JSONB;
  part_item JSONB;
  part_cost NUMERIC;
  needs_update BOOLEAN;
  updated_count INT := 0;
  skipped_count INT := 0;
  i INT;
BEGIN
  -- Duyệt qua tất cả work_orders có partsused
  FOR wo_record IN 
    SELECT id, partsused, branchid 
    FROM work_orders 
    WHERE partsused IS NOT NULL 
      AND jsonb_array_length(partsused) > 0
  LOOP
    needs_update := FALSE;
    updated_parts := '[]'::JSONB;
    
    -- Duyệt qua từng phụ tùng trong partsused
    FOR i IN 0..jsonb_array_length(wo_record.partsused) - 1 LOOP
      part_item := wo_record.partsused->i;
      
      -- Kiểm tra nếu đã có costPrice và > 0 thì giữ nguyên
      IF (part_item->>'costPrice')::NUMERIC > 0 THEN
        updated_parts := updated_parts || part_item;
        CONTINUE;
      END IF;
      
      -- Tra cứu costPrice từ bảng parts
      SELECT ("costPrice"->>COALESCE(wo_record.branchid, 'CN1'))::NUMERIC INTO part_cost
      FROM parts
      WHERE id::TEXT = (part_item->>'partId');
      
      IF part_cost IS NOT NULL AND part_cost > 0 THEN
        -- Cập nhật costPrice
        part_item := part_item || jsonb_build_object('costPrice', part_cost);
        needs_update := TRUE;
      END IF;
      
      updated_parts := updated_parts || part_item;
    END LOOP;
    
    -- Cập nhật work_order nếu cần
    IF needs_update THEN
      UPDATE work_orders 
      SET partsused = updated_parts 
      WHERE id = wo_record.id;
      
      updated_count := updated_count + 1;
    ELSE
      skipped_count := skipped_count + 1;
    END IF;
  END LOOP;
  
  RETURN format('Đã cập nhật: %s phiếu, Bỏ qua: %s phiếu', updated_count, skipped_count);
END;
$$;

-- Chạy function
SELECT backfill_partsused_costprice();

-- Xóa function sau khi chạy xong
DROP FUNCTION IF EXISTS backfill_partsused_costprice();
