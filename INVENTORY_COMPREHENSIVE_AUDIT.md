# 📋 BÁO CÁO KIỂM TRA TOÀN DIỆN - TRANG QUẢN LÝ KHO

**Ngày kiểm tra:** 12/11/2025  
**Trạng thái:** ⚠️ CẦN BỔ SUNG VÀ SỬA CHỮA

---

## 1. ✅ CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH

### 1.1. CRUD Cơ bản

- ✅ Xem danh sách sản phẩm (pagination)
- ✅ Thêm sản phẩm mới
- ✅ Sửa sản phẩm (tên, giá, tồn kho)
- ✅ Xóa sản phẩm
- ✅ Tìm kiếm sản phẩm (tên, SKU, category)

### 1.2. Nhập kho

- ✅ Tạo phiếu nhập kho
- ✅ Thêm nhiều sản phẩm vào phiếu
- ✅ Tự động cập nhật tồn kho
- ✅ Ghi lịch sử nhập kho (inventory_transactions)
- ✅ Chọn nhà cung cấp

### 1.3. Import/Export

- ✅ Import Excel (thêm/cập nhật sản phẩm hàng loạt)
- ✅ Export Excel (danh sách tồn kho)
- ✅ Download template Excel

### 1.4. Lịch sử nhập kho

- ✅ Xem lịch sử theo thời gian (7 ngày, 30 ngày, tháng này, tùy chọn)
- ✅ Group theo phiếu nhập (receipt code)
- ✅ Hiển thị chi tiết: ngày, NCC, sản phẩm, số lượng, đơn giá
- ✅ Edit phiếu nhập kho (modal đầy đủ)
- ✅ Autocomplete nhà cung cấp
- ✅ Thêm/sửa nhà cung cấp inline
- ✅ Thêm sản phẩm vào phiếu
- ✅ Xóa sản phẩm khỏi phiếu

### 1.5. Giá cả

- ✅ 3 loại giá: Giá nhập (costPrice), Giá bán lẻ (retailPrice), Giá bán sỉ (wholesalePrice)
- ✅ Hiển thị và cập nhật giá theo chi nhánh (JSONB)

---

## 2. ❌ VẤN ĐỀ NGHIÊM TRỌNG - LOGIC KẾ TOÁN

### 2.1. **THIẾU: Quản lý công nợ nhà cung cấp**

#### Vấn đề:

- ❌ Modal edit phiếu có UI "Công nợ" nhưng KHÔNG hoạt động
- ❌ Không lưu thông tin thanh toán vào database
- ❌ Không có bảng `supplier_debts` hoặc `payment_transactions`
- ❌ Nút "Tạo phiếu chi" không làm gì cả

#### Ảnh hưởng:

- 🚨 **Không theo dõi được nợ nhà cung cấp**
- 🚨 **Không biết đã trả bao nhiêu, còn nợ bao nhiêu**
- 🚨 **Kế toán không chính xác**

#### Code hiện tại (GIẢI PHÁP TÌNH THỜI):

```typescript
// File: InventoryManager.tsx line ~1590
const [payments, setPayments] = useState([
  {
    time: "15:31",
    date: receipt.date,
    payer: "Xuân Nhan",
    cashier: "(Tiền mặt)",
    amount: receipt.total,
  },
]);
const [isPaid, setIsPaid] = useState(true);
```

**⚠️ State này chỉ trong memory, KHÔNG LƯU VÀO DATABASE!**

---

### 2.2. **THIẾU: Tích hợp với module tài chính**

#### Vấn đề:

- ❌ Nhập kho KHÔNG tạo phiếu chi tự động
- ❌ Không kết nối với `cash_transactions` table
- ❌ Không cập nhật số dư quỹ tiền mặt/ngân hàng

#### Code cần bổ sung:

```typescript
// Khi lưu phiếu nhập kho:
// 1. Tạo inventory_transactions (✅ ĐÃ CÓ)
// 2. Tạo cash_transaction loại "expense" (❌ THIẾU)
// 3. Tạo supplier_debt record (❌ THIẾU)
// 4. Cập nhật payment_source balance (❌ THIẾU)
```

---

### 2.3. **THIẾU: Điều chỉnh tồn kho (Stock Adjustment)**

#### Vấn đề:

- ❌ Không có tính năng kiểm kê và điều chỉnh tồn kho
- ❌ Không có lý do điều chỉnh (hỏng hóc, mất mát, sai sót)
- ❌ Không audit trail cho việc điều chỉnh

#### Cần implement:

```typescript
interface StockAdjustment {
  id: string;
  partId: string;
  branchId: string;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  reason: "damaged" | "lost" | "inventory_count" | "other";
  notes: string;
  adjustedBy: string;
  date: string;
}
```

---

### 2.4. **RỦI RO: Logic cập nhật tồn kho**

#### Vấn đề hiện tại:

1. **Có 2 cách cập nhật tồn kho:**

   - ✅ Trigger database (adjust_part_stock) - Tự động
   - ✅ Code React (updatePartMutation) - Thủ công

2. **Trigger đã bị TẮT** (sql/2025-11-12_simple_inventory_no_trigger.sql)

   ```sql
   -- 4. Drop any existing trigger (để tránh lỗi với function chưa có)
   DROP TRIGGER IF EXISTS trg_inventory_tx_after_insert ON public.inventory_transactions CASCADE;
   ```

3. **Hiện tại chỉ dùng React code:**
   ```typescript
   // File: InventoryManager.tsx line ~3155
   updatePartMutation.mutate({
     id: item.partId,
     updates: {
       stock: {
         ...part.stock,
         [currentBranchId]: currentStock + item.quantity,
       },
     },
   });
   ```

#### Rủi ro:

- ⚠️ Nếu React code fail (network, timeout), tồn kho KHÔNG được cập nhật
- ⚠️ Nếu ai đó insert trực tiếp vào DB, tồn kho KHÔNG tự động cập nhật
- ⚠️ Race condition khi nhiều người nhập kho cùng lúc

#### Giải pháp đề xuất:

**DÙNG LẠI TRIGGER** nhưng fix đúng signature:

```sql
-- File: sql/2025-11-12_fix_adjust_part_stock_signature.sql
CREATE OR REPLACE FUNCTION public.adjust_part_stock(
  p_part_id TEXT,
  p_branch_id TEXT,
  p_delta NUMERIC  -- ✅ ĐÚNG: NUMERIC thay vì INT
)
```

---

## 3. ❌ VẤN ĐỀ LOGIC LƯU TRỮ DỮ LIỆU

### 3.1. **SAI: Edit phiếu nhập kho không update tồn kho**

#### Code hiện tại (SAI):

```typescript
// File: InventoryManager.tsx line ~2590
onSave={async (updatedData) => {
  for (const item of updatedData.items) {
    await supabase
      .from("inventory_transactions")
      .update({
        quantity: item.quantity,      // ✅ Update transaction
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })
      .eq("id", item.id);
  }
  // ❌ THIẾU: Không cập nhật lại parts.stock!
}}
```

#### Vấn đề:

1. User edit SL từ 5 → 10 trong inventory_transactions
2. Nhưng parts.stock VẪN GIỮ NGUYÊN
3. **Dữ liệu KHÔNG ĐỒNG BỘ!**

#### Giải pháp:

```typescript
onSave={async (updatedData) => {
  for (const item of updatedData.items) {
    const oldTransaction = receipt.items.find(i => i.id === item.id);
    const quantityDiff = item.quantity - oldTransaction.quantity;

    // 1. Update transaction
    await supabase
      .from("inventory_transactions")
      .update({...})
      .eq("id", item.id);

    // 2. Update stock (CRITICAL!)
    if (quantityDiff !== 0) {
      await supabase.rpc('adjust_part_stock', {
        p_part_id: item.partId,
        p_branch_id: currentBranchId,
        p_delta: quantityDiff
      });
    }
  }
}}
```

---

### 3.2. **SAI: Thêm sản phẩm mới vào phiếu không tạo transaction**

#### Code hiện tại:

```typescript
// File: InventoryManager.tsx line ~1680
const handleAddProduct = (product) => {
  const newItem = {
    id: `new-${Date.now()}`, // ❌ ID tạm
    partName: product.partName,
    quantity: product.quantity,
    unitPrice: product.unitPrice,
    totalPrice: product.quantity * product.unitPrice,
  };
  setItems([...items, newItem]); // ✅ Add to UI
  // ❌ THIẾU: Không tạo inventory_transaction mới!
  // ❌ THIẾU: Không cập nhật parts.stock!
};
```

#### Vấn đề:

- Chỉ update UI state
- Khi click "LƯU", code chỉ update existing items
- Items mới với `id: new-xxx` SẼ KHÔNG ĐƯỢC LƯU!

---

### 3.3. **SAI: Xóa sản phẩm khỏi phiếu không rollback tồn kho**

#### Code hiện tại:

```typescript
// File: InventoryManager.tsx line ~1665
const removeItem = (index: number) => {
  const newItems = items.filter((_, i) => i !== index);
  setItems(newItems); // ✅ Remove from UI
  // ❌ THIẾU: Không xóa inventory_transaction
  // ❌ THIẾU: Không rollback parts.stock (trừ lại số lượng)
};
```

#### Ảnh hưởng:

- Tồn kho bị thừa (vì đã cộng vào lúc nhập)
- Database có transaction "rác"

---

### 3.4. **CẢNH BÁO: Import Excel cập nhật giá sai**

#### Code hiện tại:

```typescript
// File: InventoryManager.tsx line ~4018
partsToUpdate.push({
  stock: {
    [currentBranchId]: currentStock + item.quantity, // ✅ Cộng tồn
  },
  costPrice: {
    [currentBranchId]: item.costPrice, // ❌ GHI ĐÈ giá cũ
  },
  retailPrice: {
    [currentBranchId]: item.retailPrice, // ❌ GHI ĐÈ giá cũ
  },
});
```

#### Vấn đề:

- Nếu sản phẩm đã có giá 100k
- User import file với giá 50k
- Hệ thống GHI ĐÈ thành 50k
- **Mất dữ liệu giá cũ!**

#### Giải pháp đề xuất:

```typescript
// Option 1: Giữ nguyên giá cũ
costPrice: {
  ...existingPart.costPrice,  // ✅ Keep old prices
  // Chỉ update nếu user chọn option "Cập nhật giá"
}

// Option 2: Lưu lịch sử giá
await supabase.from('price_history').insert({
  partId: item.partId,
  oldPrice: existingPart.costPrice[branchId],
  newPrice: item.costPrice,
  changedBy: userId,
  reason: 'import_excel'
});
```

---

## 4. ❌ VẤN ĐỀ BẢO MẬT VÀ AUDIT

### 4.1. **THIẾU: Audit trail đầy đủ**

#### Vấn đề:

- ✅ Có audit cho CRUD sản phẩm
- ❌ THIẾU audit cho edit phiếu nhập kho
- ❌ THIẾU audit cho điều chỉnh giá
- ❌ THIẾU audit cho xóa transaction

#### Cần bổ sung:

```typescript
// Khi edit phiếu:
await safeAudit(userId, {
  action: "inventory.receipt.edit",
  tableName: "inventory_transactions",
  recordId: receipt.receiptCode,
  oldData: { items: receipt.items },
  newData: { items: updatedData.items },
  metadata: {
    supplier: updatedData.supplier,
    totalChange: newTotal - oldTotal,
  },
});
```

---

### 4.2. **RỦI RO: Không kiểm tra quyền hạn**

#### Vấn đề:

- ❌ Bất kỳ user nào cũng có thể edit/delete phiếu nhập kho
- ❌ Không phân quyền xem giá nhập
- ❌ Không giới hạn edit phiếu cũ (ví dụ: chỉ edit trong 24h)

#### Giải pháp:

```typescript
// Check permission trước khi edit
if (!canDo(profile, "inventory:edit", currentBranchId)) {
  showToast.error("Bạn không có quyền sửa phiếu nhập kho");
  return;
}

// Check time limit
const receiptAge = Date.now() - new Date(receipt.date).getTime();
const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours
if (receiptAge > maxEditTime) {
  showToast.error("Chỉ được sửa phiếu trong vòng 24 giờ");
  return;
}
```

---

## 5. ❌ VẤN ĐỀ UI/UX

### 5.1. **THIẾU: Validation**

- ❌ Không kiểm tra số lượng âm
- ❌ Không kiểm tra giá nhập > giá bán
- ❌ Không warning khi tồn kho âm

### 5.2. **THIẾU: Loading states**

- ❌ Khi lưu phiếu, không có loading indicator
- ❌ User có thể click "LƯU" nhiều lần → duplicate data

### 5.3. **THIẾU: Error handling**

- ❌ Nếu network fail giữa chừng, data bị lỗi
- ❌ Không có retry mechanism
- ❌ Error messages không rõ ràng

---

## 6. 📊 ĐÁNH GIÁ TỔNG QUAN

### Điểm mạnh:

- ✅ UI đẹp, responsive
- ✅ CRUD cơ bản hoàn chỉnh
- ✅ Import/Export Excel tốt
- ✅ Lịch sử nhập kho chi tiết

### Điểm yếu nghiêm trọng:

- 🚨 **Không quản lý công nợ NCC**
- 🚨 **Edit phiếu không sync tồn kho**
- 🚨 **Thiếu tích hợp tài chính**
- 🚨 **Thiếu điều chỉnh tồn kho**
- ⚠️ **Trigger database bị tắt**
- ⚠️ **Validation yếu**
- ⚠️ **Audit trail không đầy đủ**

---

## 7. 🛠️ KHUYẾN NGHỊ ƯU TIÊN

### Priority 1 (CRITICAL - BẮT BUỘC):

1. **Fix edit phiếu nhập kho sync tồn kho**

   - Khi edit SL → Update parts.stock
   - Khi thêm item mới → Create transaction + Update stock
   - Khi xóa item → Delete transaction + Rollback stock

2. **Enable lại trigger database**

   - Fix signature function `adjust_part_stock`
   - Test kỹ trigger hoạt động đúng
   - Đảm bảo tồn kho luôn đồng bộ

3. **Implement quản lý công nợ NCC**
   - Tạo table `supplier_debts`
   - Lưu trạng thái thanh toán
   - Tạo phiếu chi tự động

### Priority 2 (HIGH - NÊN LÀM):

4. **Tích hợp module tài chính**

   - Nhập kho → Tạo phiếu chi
   - Cập nhật số dư quỹ
   - Link với cash_transactions

5. **Thêm stock adjustment**

   - UI kiểm kê tồn kho
   - Điều chỉnh có lý do
   - Audit trail đầy đủ

6. **Cải thiện validation**
   - Check số âm, giá hợp lý
   - Warning conflicts
   - Better error messages

### Priority 3 (MEDIUM - CÓ THỂ LÀM SAU):

7. **Thêm permission checks**
8. **Price history tracking**
9. **Better loading/error states**
10. **Export báo cáo nhập kho**

---

## 8. 📝 KẾT LUẬN

**Trạng thái hiện tại:**

- ✅ UI/UX: 85% hoàn thành
- ⚠️ Logic kế toán: **40% hoàn thành** (thiếu công nợ, tài chính)
- ❌ Logic lưu trữ: **60% hoàn thành** (edit phiếu có vấn đề)
- ⚠️ Database integrity: **70% hoàn thành** (trigger bị tắt)

**Khuyến nghị:**

- 🚨 **KHÔNG NÊN đưa vào production** cho đến khi fix xong Priority 1
- ⚠️ Nếu dùng, CẨN THẬN với tính năng edit phiếu nhập kho
- ✅ Các tính năng CRUD cơ bản, import/export CÓ THỂ dùng an toàn

**Thời gian ước tính để fix:**

- Priority 1: 2-3 ngày
- Priority 2: 3-4 ngày
- Priority 3: 2-3 ngày
- **TỔNG: ~1.5-2 tuần** để hoàn thiện 100%

---

**Người kiểm tra:** GitHub Copilot  
**Ngày:** 12/11/2025  
**Phiên bản:** 1.0
