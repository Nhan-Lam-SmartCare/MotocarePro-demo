-- AFTER INSERT trigger to adjust parts.stock based on inventory_transactions rows
-- Types handled:
--   'Nhập kho'  -> increase stock
--   'Xuất kho'  -> decrease stock
-- Other types are ignored (extend as needed).

CREATE OR REPLACE FUNCTION public.inventory_tx_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.type = 'Nhập kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", NEW.quantity);
  ELSIF NEW.type = 'Xuất kho' THEN
    PERFORM public.adjust_part_stock(NEW."partId", NEW."branchId", -NEW.quantity);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.inventory_transactions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_tx_after_insert'
    ) THEN
      CREATE TRIGGER trg_inventory_tx_after_insert
      AFTER INSERT ON public.inventory_transactions
      FOR EACH ROW EXECUTE FUNCTION public.inventory_tx_after_insert();
    END IF;
  END IF;
END $$;
