# 🔍 Theme Issues Checklist

## Các vấn đề đã phát hiện cần sửa

### 1. ⚠️ Hardcode màu tối (bg-slate-7/8xx)

Các component sau đang hardcode màu tối mà không có điều kiện dark:

#### CustomerManager.tsx

- Line 879, 893, 908, 920, 930: Form inputs với `bg-slate-700`
- Line 549-574: Segment badges với `bg-gradient-to-br from-*-500 to-*-700`

**Ảnh hưởng:** Khi ở light mode, các input vẫn hiển thị với nền tối

**Cách sửa:**

```tsx
// Trước:
className = "bg-slate-700 text-white";

// Sau:
className = "bg-primary-bg text-primary-text border border-secondary-border";
```

#### SalesManager.tsx

- ✅ Line 886-887: Product cards - **ĐÃ SỬA**

#### InventoryManager.tsx

- Nhiều form inputs và buttons với `bg-slate-700`
- Table headers với `bg-slate-100 dark:bg-slate-700`

#### Các component khác:

- ServiceHistory.tsx: Filters và inputs
- DebtManager.tsx: Cards và forms
- PayrollManager.tsx: Tables và inputs

### 2. ⚠️ Gradient không adaptive

#### FinanceManager.tsx

- ✅ Line 13: Header gradient - **ĐÃ SỬA**

#### CustomerManager.tsx

- Line 666, 683: Progress bar gradients

**Cách sửa:**

```tsx
// Trước:
className = "bg-gradient-to-br from-slate-800 to-slate-900";

// Sau:
className =
  "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900";
```

### 3. ⚠️ Text colors hardcode

Nhiều component dùng:

- `text-white` mà không có dark condition
- `text-slate-400` không phân biệt mode

**Cần thay bằng:**

- `text-primary-text`
- `text-secondary-text`
- `text-tertiary-text`

### 4. ✅ Đã sửa

- [x] FinanceManager.tsx - Header gradient
- [x] SalesManager.tsx - Product cards
- [x] THEME_GUIDE.md - Added troubleshooting section

## 🎯 Ưu tiên sửa

### Priority 1 - Critical (Ảnh hưởng UX rõ rệt)

1. **SalesManager.tsx** - Product cards (✅ Done)
2. **CustomerManager.tsx** - Form modals
3. **InventoryManager.tsx** - Product cards và modals

### Priority 2 - Important

4. **DebtManager.tsx** - Debt cards
5. **FinanceManager.tsx** - Transaction cards (✅ Header done)
6. **ServiceHistory.tsx** - Service cards

### Priority 3 - Nice to have

7. Các utility components
8. Empty states
9. Loading states

## 📋 Action Plan

### Immediate (Ngay lập tức)

```bash
# Sửa các component ưu tiên cao:
1. CustomerManager.tsx - Modal forms
2. InventoryManager.tsx - Product display
```

### Short-term (Ngắn hạn)

```bash
# Migration hệ thống:
1. Tạo utility classes cho common patterns
2. Document các patterns mới
3. Review và update tất cả components
```

### Long-term (Dài hạn)

```bash
# Maintenance:
1. Set up linting rules để catch hardcode colors
2. Create reusable themed components
3. Automated testing cho light/dark mode
```

## 🛠️ Quick Fixes

### Replace patterns

#### Pattern 1: Form Inputs

```tsx
// Old
className = "bg-slate-700 border border-slate-600 text-white";

// New
className = "bg-primary-bg border border-secondary-border text-primary-text";
```

#### Pattern 2: Cards

```tsx
// Old
className = "bg-slate-800 text-white";

// New
className = "bg-primary-bg text-primary-text border border-primary-border";
```

#### Pattern 3: Buttons (Secondary)

```tsx
// Old
className = "bg-slate-700 hover:bg-slate-600 text-white";

// New
className =
  "bg-primary-bg hover:bg-tertiary-bg text-primary-text border border-primary-border";
```

#### Pattern 4: Table Headers

```tsx
// Old
className = "bg-slate-50 dark:bg-slate-700";

// New
className = "bg-tertiary-bg";
```

## 🧪 Testing Checklist

Sau khi sửa mỗi component:

- [ ] Test light mode - Tất cả elements có màu phù hợp
- [ ] Test dark mode - Tất cả elements có màu phù hợp
- [ ] Toggle giữa modes - Transition mượt mà
- [ ] Contrast ratio - Đảm bảo đọc được text
- [ ] Hover states - Hoạt động đúng cả 2 modes
- [ ] Focus states - Rõ ràng cho accessibility
- [ ] Forms - Input fields và labels readable
- [ ] Icons - Màu phù hợp với context

---

**Document được tạo:** 09/11/2025
**Cập nhật lần cuối:** 09/11/2025
