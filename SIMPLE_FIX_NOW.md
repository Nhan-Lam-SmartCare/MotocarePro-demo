# 🚨 KHẮC PHỤC NHANH - INVENTORY SYSTEM

## ⚡ GIẢI PHÁP ĐƠN GIẢN NHẤT

Vấn đề hiện tại: Function trigger đang gây lỗi liên tục.

**Giải pháp**: Tắt trigger, chỉ tạo bảng. Stock sẽ được update bởi code React (đã có sẵn).

---

## 📝 BƯỚC 1: Kiểm tra hiện trạng

Chạy file này trong Supabase SQL Editor:

```
sql/CHECK_INVENTORY_SETUP.sql
```

Xem output để biết thiếu gì.

---

## 🔧 BƯỚC 2: Chạy script đơn giản

**File**: `sql/2025-11-12_simple_inventory_no_trigger.sql`

Script này sẽ:

- ✅ Tạo bảng `inventory_transactions`
- ✅ Tạo indexes
- ✅ Setup RLS policies đơn giản
- ✅ **KHÔNG tạo trigger** (để tránh lỗi function)
- ✅ Stock sẽ được update bởi code React

### Các bước:

1. **Mở Supabase Dashboard** → **SQL Editor**
2. **Copy file** `sql/2025-11-12_simple_inventory_no_trigger.sql`
3. **Paste và Run**
4. **Xem output**:
   ```
   ✅ Table inventory_transactions created successfully
   🎉 Setup complete! Inventory transactions table is ready.
   ℹ️  Note: Automatic stock update trigger is DISABLED
   ℹ️  Stock will be updated manually in the application code.
   ```

---

## ✅ BƯỚC 3: Test lại

1. **Refresh trang web** (Ctrl+F5)
2. Vào **Quản lý kho** → **"+ Tạo phiếu nhập"**
3. Thêm phụ tùng và lưu
4. **KẾT QUẢ MONG ĐỢI**:
   - ✅ Toast "Nhập kho thành công!"
   - ✅ Tồn kho tự động cập nhật (bởi code React)
   - ✅ Lịch sử hiển thị đúng
   - ✅ KHÔNG có lỗi function nữa

---

## 🔍 Tại sao giải pháp này hoạt động?

**Vấn đề cũ**:

- Trigger cần function `adjust_part_stock`
- Function này khó setup đúng (lỗi signature, dependencies...)

**Giải pháp mới**:

- ❌ KHÔNG dùng trigger
- ✅ Code React đã có sẵn logic update stock:
  ```typescript
  // File: InventoryManager.tsx line ~1775
  updatePartMutation.mutate({
    id: item.partId,
    updates: {
      stock: {
        ...part.stock,
        [currentBranchId]: currentStock + item.quantity,
      },
      ...
    },
  });
  ```

---

## 📞 Nếu vẫn lỗi

### Lỗi: Bảng vẫn không tồn tại

➡️ Chạy lại script `2025-11-12_simple_inventory_no_trigger.sql`

### Lỗi: Permission denied

➡️ Kiểm tra RLS policies, đảm bảo user đã login

### Lỗi khác

➡️ Mở Console (F12) và gửi screenshot lỗi

---

## 🎯 Kết luận

Script này giải quyết vấn đề một cách **đơn giản và hiệu quả**:

- Không cần function phức tạp
- Không cần trigger
- Code React sẽ lo việc update stock
- Lịch sử vẫn được ghi đúng

**Hãy chạy script này ngay!** 🚀
