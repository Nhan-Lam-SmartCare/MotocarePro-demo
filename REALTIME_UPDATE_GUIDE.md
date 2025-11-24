# Hướng dẫn Cập nhật Realtime - Motocare

## 📋 Tổng quan

Toàn bộ ứng dụng đã được cấu hình để **cập nhật giao diện ngay lập tức** sau mọi thao tác CRUD (Create, Read, Update, Delete) mà không cần reload trang.

## ✅ Các tính năng đã được cập nhật

### 1. **Bán hàng (Sales)**

#### Khi tạo đơn hàng mới:

- ✅ Danh sách đơn hàng cập nhật ngay
- ✅ Tồn kho giảm ngay lập tức
- ✅ Lịch sử xuất kho hiển thị ngay
- ✅ Thống kê doanh thu cập nhật tự động

**Queries được invalidate:**

```typescript
qc.invalidateQueries({ queryKey: ["salesRepo"] });
qc.invalidateQueries({ queryKey: ["salesRepoPaged"] });
qc.invalidateQueries({ queryKey: ["salesRepoKeyset"] });
qc.invalidateQueries({ queryKey: ["partsRepo"] }); // Stock update
qc.invalidateQueries({ queryKey: ["partsRepoPaged"] }); // Stock update
qc.invalidateQueries({ queryKey: ["inventoryTxRepo"] }); // Inventory history
```

#### Khi xóa/hoàn tiền đơn hàng:

- ✅ Đơn hàng biến mất khỏi danh sách
- ✅ Tồn kho được hoàn lại ngay
- ✅ Lịch sử kho cập nhật

#### Khi trả hàng một phần:

- ✅ Số lượng trong đơn cập nhật
- ✅ Tồn kho tăng lại theo số lượng trả
- ✅ Lịch sử xuất/nhập kho cập nhật

---

### 2. **Quản lý Kho (Inventory)**

#### Khi tạo phiếu nhập kho:

- ✅ Danh sách phiếu nhập hiển thị ngay
- ✅ Tồn kho tăng ngay lập tức
- ✅ Giá nhập/bán được cập nhật
- ✅ Lịch sử nhập kho hiển thị đầy đủ

**Queries được invalidate:**

```typescript
queryClient.invalidateQueries({ queryKey: ["inventoryTransactions"] });
queryClient.invalidateQueries({ queryKey: ["inventoryTxRepo"] });
queryClient.invalidateQueries({ queryKey: ["partsRepo"] });
queryClient.invalidateQueries({ queryKey: ["partsRepoPaged"] });
```

#### Khi thêm/sửa/xóa sản phẩm:

- ✅ Danh sách sản phẩm cập nhật ngay
- ✅ Bộ lọc và tìm kiếm hoạt động tức thì
- ✅ Thống kê tồn kho tự động refresh

---

### 3. **Sửa chữa (Service/Work Orders)**

#### Khi tạo lệnh sửa chữa mới:

- ✅ Danh sách lệnh sửa chữa cập nhật ngay
- ✅ Phụ tùng sử dụng trừ kho tức thì
- ✅ Lịch sử xuất kho hiển thị ngay
- ✅ Trạng thái xe cập nhật tự động

**Queries được invalidate:**

```typescript
qc.invalidateQueries({ queryKey: ["workOrdersRepo"] });
qc.invalidateQueries({ queryKey: ["partsRepo"] });
qc.invalidateQueries({ queryKey: ["partsRepoPaged"] });
qc.invalidateQueries({ queryKey: ["inventoryTxRepo"] });
```

#### Khi cập nhật/hủy/hoàn tiền lệnh sửa chữa:

- ✅ Trạng thái cập nhật ngay lập tức
- ✅ Tồn kho được hoàn lại (nếu hủy/refund)
- ✅ Lịch sử kho cập nhật đầy đủ

---

### 4. **Khách hàng (Customers)**

#### Khi thêm/sửa/xóa khách hàng:

- ✅ Danh sách khách hàng refresh ngay
- ✅ Thông tin chi tiết cập nhật tức thì
- ✅ Điểm thành viên hiển thị chính xác

**Queries được invalidate:**

```typescript
queryClient.invalidateQueries({ queryKey: ["customers"] });
```

---

### 5. **Nhà cung cấp (Suppliers)**

#### Khi thêm/sửa/xóa nhà cung cấp:

- ✅ Danh sách NCC cập nhật ngay
- ✅ Công nợ hiển thị chính xác
- ✅ Lịch sử giao dịch đồng bộ

**Queries được invalidate:**

```typescript
queryClient.invalidateQueries({ queryKey: ["suppliers"] });
```

---

## 🔧 Cơ chế hoạt động

### React Query + Invalidation

Ứng dụng sử dụng **React Query** để quản lý cache và tự động refetch data khi cần:

1. **Sau mỗi mutation thành công** → Invalidate queries liên quan
2. **React Query tự động refetch** → UI cập nhật ngay
3. **Background updates** → Không làm gián đoạn UX

### Optimistic Updates (Optional)

Có thể bật optimistic updates để UI phản hồi ngay cả trước khi server xác nhận:

```typescript
onMutate: async (newData) => {
  // Cancel outgoing refetches
  await qc.cancelQueries({ queryKey: ["salesRepo"] });

  // Snapshot previous value
  const previous = qc.getQueryData(["salesRepo"]);

  // Optimistically update
  qc.setQueryData(["salesRepo"], (old) => [...old, newData]);

  return { previous };
};
```

---

## 📊 Danh sách Query Keys

### Sales (Bán hàng)

- `salesRepo` - Danh sách đơn hàng
- `salesRepoPaged` - Đơn hàng phân trang (offset)
- `salesRepoKeyset` - Đơn hàng phân trang (keyset)

### Inventory (Kho)

- `partsRepo` - Danh sách sản phẩm
- `partsRepoPaged` - Sản phẩm phân trang
- `inventoryTxRepo` - Lịch sử xuất/nhập kho
- `inventoryTransactions` - Transaction history

### Service (Sửa chữa)

- `workOrdersRepo` - Danh sách lệnh sửa chữa

### Customers & Suppliers

- `customers` - Danh sách khách hàng
- `suppliers` - Danh sách nhà cung cấp

---

## 🎯 Best Practices

### 1. Luôn invalidate đủ queries liên quan

```typescript
// ❌ Sai - Chỉ invalidate một query
qc.invalidateQueries({ queryKey: ["salesRepo"] });

// ✅ Đúng - Invalidate tất cả queries liên quan
qc.invalidateQueries({ queryKey: ["salesRepo"] });
qc.invalidateQueries({ queryKey: ["salesRepoPaged"] });
qc.invalidateQueries({ queryKey: ["partsRepo"] }); // Nếu có trừ kho
qc.invalidateQueries({ queryKey: ["inventoryTxRepo"] }); // Nếu có lịch sử
```

### 2. Sử dụng atomic operations

```typescript
// ✅ Đúng - Dùng atomic RPC
await createSaleAtomic(saleData); // Tự động trừ kho + tạo lịch sử

// ❌ Sai - Tách rời operations
await createSale(saleData);
await updateStock(items); // Risk: Race condition
await createInventoryTx(items);
```

### 3. Toast messages hợp lý

```typescript
onSuccess: () => {
  showToast.success("Đã tạo đơn hàng"); // Short & clear
  // Không spam nhiều toast cùng lúc
};
```

---

## 🐛 Troubleshooting

### Vấn đề: UI không cập nhật sau mutation

**Nguyên nhân:** Thiếu invalidate queries

**Giải pháp:**

```typescript
// Kiểm tra console log
console.log("✅ Mutation success, invalidating queries...");
qc.invalidateQueries({ queryKey: ["yourQueryKey"] });
```

### Vấn đề: Tồn kho bị nhân đôi

**Nguyên nhân:** Trigger + Manual update cùng cập nhật stock

**Giải pháp:** Đã fix trong `receipt_create_atomic.sql` - chỉ trigger update stock

### Vấn đề: Queries bị refetch quá nhiều

**Nguyên nhân:** Invalidate quá rộng

**Giải pháp:**

```typescript
// ❌ Tránh invalidate toàn bộ
qc.invalidateQueries(); // Too broad!

// ✅ Chỉ invalidate cụ thể
qc.invalidateQueries({ queryKey: ["salesRepo"] });
```

---

## 📝 Checklist khi thêm feature mới

Khi implement feature CRUD mới, đảm bảo:

- [ ] Mutation hook có `onSuccess` callback
- [ ] `onSuccess` invalidate đủ queries liên quan
- [ ] Test thêm/sửa/xóa → UI cập nhật ngay
- [ ] Test trên mobile và desktop
- [ ] Toast message rõ ràng và không spam
- [ ] Console log để debug (có thể remove sau)

---

## 🎉 Kết luận

Toàn bộ ứng dụng đã được tối ưu để:

- ✅ **Realtime updates** - Không cần reload trang
- ✅ **Consistent UI** - Luôn đồng bộ với server
- ✅ **Fast UX** - Background refetch không block UI
- ✅ **Reliable** - Atomic operations đảm bảo data integrity

**Nguyên tắc vàng:** Mỗi mutation → Invalidate đủ queries → UI tự cập nhật! 🚀
