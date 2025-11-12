-- Kiểm tra và tạo lại trigger cho inventory_transactions
-- Đảm bảo sử dụng đúng tên cột

-- 1. Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions;

-- 2. Tạo lại function với tên cột đúng
CREATE OR REPLACE FUNCTION public.inventory_tx_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log để debug
  RAISE NOTICE 'Trigger fired: type=%, partId=%, branchId=%, quantity=%', NEW.type, NEW."partId", NEW."branchId", NEW.quantity;
  
  IF NEW.type = 'Nhập kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", NEW.quantity::INT);
  ELSIF NEW.type = 'Xuất kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", -(NEW.quantity::INT));
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger: %', SQLERRM;
    RETURN NEW; -- Không fail toàn bộ transaction
END;
$$;

-- 3. Tạo lại trigger
CREATE TRIGGER trg_inventory_tx_after_insert
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW 
  EXECUTE FUNCTION public.inventory_tx_after_insert();

-- 4. Test trigger bằng cách insert một bản ghi test (optional - comment out nếu không muốn)
-- INSERT INTO public.inventory_transactions (id, type, "partId", "partName", quantity, date, "unitPrice", "totalPrice", "branchId", notes)
-- VALUES ('test-' || gen_random_uuid(), 'Nhập kho', 'test-part', 'Test Part', 1, NOW(), 1000, 1000, 'CN1', 'Test trigger');
