# Hướng dẫn khắc phục lỗi "function public.adjust_part_stock does not exist"

## ❌ Vấn đề

Lỗi: `function public.adjust_part_stock(text, text, numeric) does not exist`

## 🔍 Nguyên nhân

Function `adjust_part_stock` trong database được định nghĩa với tham số thứ 3 là `INT`, nhưng trigger gọi function với giá trị `NUMERIC` (do column `quantity` trong bảng `inventory_transactions` có type là `NUMERIC`).

## ✅ Giải pháp

### Bước 1: Cập nhật function trong Supabase

Truy cập **Supabase Dashboard** → **SQL Editor** và chạy script sau:

```sql
-- File: sql/2025-11-12_fix_adjust_part_stock_signature.sql

CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
  v_delta_int INT;
BEGIN
  -- Convert delta to INT for stock calculation
  v_delta_int := p_delta::INT;

  -- Lock row to avoid concurrent modification
  SELECT COALESCE((stock->>p_branch_id)::int, 0) INTO v_current
  FROM public.parts
  WHERE id = p_part_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PART_NOT_FOUND';
  END IF;

  PERFORM 1;
  UPDATE public.parts
  SET stock = jsonb_set(stock, ARRAY[p_branch_id], to_jsonb(GREATEST(0, v_current + v_delta_int)), true)
  WHERE id = p_part_id;
END;
$$;
```

### Bước 2: Kiểm tra function đã được cập nhật

Chạy query để kiểm tra signature của function:

```sql
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'adjust_part_stock';
```

Kết quả mong đợi:

- `arguments` phải là: `p_part_id text, p_branch_id text, p_delta numeric`

### Bước 3: Test lại tính năng nhập kho

1. Vào trang **Quản lý kho**
2. Click nút **"+ Tạo phiếu nhập"**
3. Thêm phụ tùng và lưu
4. Kiểm tra:
   - ✅ Không có lỗi trong Console
   - ✅ Toast "Nhập kho thành công!" hiển thị
   - ✅ Tồn kho được cập nhật
   - ✅ Lịch sử nhập kho hiển thị đúng

## 📝 Thay đổi đã thực hiện

### File đã sửa:

1. `sql/2025-11-11_adjust_part_stock.sql` - Cập nhật function signature
2. `sql/2025-11-12_fix_adjust_part_stock_signature.sql` - Migration script mới

### Thay đổi chính:

```diff
- CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta INT)
+ CREATE OR REPLACE FUNCTION public.adjust_part_stock(p_part_id TEXT, p_branch_id TEXT, p_delta NUMERIC)
```

## 🎯 Kết quả mong đợi

Sau khi chạy migration:

- ✅ Function `adjust_part_stock` chấp nhận tham số `NUMERIC`
- ✅ Trigger `trg_inventory_tx_after_insert` hoạt động bình thường
- ✅ Nhập kho thành công và cập nhật tồn kho tự động
- ✅ Lịch sử nhập kho được ghi lại đúng

## ⚠️ Lưu ý quan trọng

- **Phải chạy SQL script trên Supabase Dashboard** trước khi test lại
- Nếu vẫn lỗi, check xem trigger `trg_inventory_tx_after_insert` có tồn tại không:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'trg_inventory_tx_after_insert';
  ```
- Nếu trigger không tồn tại, chạy lại file `sql/2025-11-11_inventory_tx_trigger.sql`

## 📞 Hỗ trợ

Nếu vẫn gặp lỗi, kiểm tra:

1. Console log để xem lỗi chi tiết
2. Supabase logs (Dashboard → Logs)
3. RLS policies có cho phép INSERT vào `inventory_transactions` không
