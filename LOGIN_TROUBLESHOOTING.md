# 🔍 KIỂM TRA VÀ FIX LỖI ĐĂNG NHẬP

## ✅ Đã Fix LoginPage

**Vấn đề:** LoginPage chỉ có TODO comment, chưa gọi Supabase auth

**Đã fix:**

```typescript
// TRƯỚC:
// TODO: Implement Supabase auth
console.log("Login:", { email, password });
navigate("/");

// SAU:
await signIn(email, password); // Gọi AuthContext
showToast.success("Đăng nhập thành công!");
navigate("/dashboard");
```

---

## 🔍 KIỂM TRA DATABASE

### Bước 1: Verify Supabase Connection

**Credentials đã có:**

- ✅ VITE_SUPABASE_URL: https://uluxycppxlzdskyklgqt.supabase.co
- ✅ VITE_SUPABASE_ANON_KEY: (có)

### Bước 2: Kiểm tra Database Tables

Vào Supabase Dashboard:

1. URL: https://app.supabase.com/project/uluxycppxlzdskyklgqt
2. Vào **Table Editor**
3. Kiểm tra xem có các tables sau chưa:
   - ❓ `user_profiles`
   - ❓ `store_settings`
   - ❓ `audit_logs`

**Nếu CHƯA CÓ → Làm Bước 3**

### Bước 3: Chạy SQL Schema

1. Vào **SQL Editor** trong Supabase
2. Click **New query**
3. Copy toàn bộ nội dung file `auth_setup.sql`
4. Paste vào editor
5. Click **Run** (hoặc Ctrl+Enter)

**Chờ SQL chạy xong** (khoảng 5-10 giây)

### Bước 4: Tạo Demo Users

Vào **Authentication > Users**:

**User 1: Owner**

```
Email: owner@motocare.vn
Password: 123456
Auto Confirm Email: ✅ (bật lên)
```

**User 2: Manager**

```
Email: manager@motocare.vn
Password: 123456
Auto Confirm Email: ✅
```

**User 3: Staff**

```
Email: staff@motocare.vn
Password: 123456
Auto Confirm Email: ✅
```

### Bước 5: Update Roles

Sau khi tạo xong 3 users, vào **SQL Editor** và chạy:

```sql
-- Cập nhật roles
UPDATE user_profiles
SET role = 'owner', full_name = 'Chủ cửa hàng'
WHERE email = 'owner@motocare.vn';

UPDATE user_profiles
SET role = 'manager', full_name = 'Quản lý'
WHERE email = 'manager@motocare.vn';

UPDATE user_profiles
SET role = 'staff', full_name = 'Nhân viên'
WHERE email = 'staff@motocare.vn';
```

**Kiểm tra:**
Vào **Table Editor > user_profiles** → Xem có 3 users với đúng roles không

---

## 🧪 TEST ĐĂNG NHẬP

### Test 1: Login với Owner

```
1. Refresh app (F5)
2. Sẽ thấy trang Login
3. Nhập:
   Email: owner@motocare.vn
   Password: 123456
4. Click "Đăng nhập"
5. EXPECTED:
   - Toast hiện "Đăng nhập thành công!"
   - Redirect về Dashboard
   - Header có UserMenu với avatar
```

### Test 2: Logout

```
1. Click avatar góc phải
2. Click "🚪 Đăng xuất"
3. EXPECTED:
   - Toast hiện "Đã đăng xuất"
   - Redirect về /login
```

### Test 3: Protected Route

```
1. Logout
2. Try truy cập: http://localhost:4311/#/dashboard
3. EXPECTED:
   - Auto redirect về /login
```

---

## 🐛 NẾU VẪN KHÔNG ĐĂNG NHẬP ĐƯỢC

### Lỗi 1: "Invalid login credentials"

**Nguyên nhân:**

- Email/password sai
- User chưa được tạo
- User chưa confirm email

**Fix:**

- Kiểm tra lại email/password
- Vào Supabase Auth > Users → Xem user có tồn tại không
- Check "Email Confirmed" column = ✅

### Lỗi 2: "Cannot read properties of null"

**Nguyên nhân:** Table `user_profiles` chưa có data

**Fix:**

```sql
-- Kiểm tra trong SQL Editor:
SELECT * FROM user_profiles WHERE email = 'owner@motocare.vn';

-- Nếu rỗng → Chưa chạy trigger hoặc chưa có data
-- Thêm manual:
INSERT INTO user_profiles (id, email, role, full_name)
SELECT
  id,
  email,
  'owner' as role,
  'Chủ cửa hàng' as full_name
FROM auth.users
WHERE email = 'owner@motocare.vn';
```

### Lỗi 3: "User not found in user_profiles"

**Nguyên nhân:** Trigger không chạy tự động

**Fix:**

```sql
-- Chạy manual insert cho 3 users:
INSERT INTO user_profiles (id, email, role, full_name)
SELECT
  u.id,
  u.email,
  CASE
    WHEN u.email = 'owner@motocare.vn' THEN 'owner'
    WHEN u.email = 'manager@motocare.vn' THEN 'manager'
    ELSE 'staff'
  END as role,
  CASE
    WHEN u.email = 'owner@motocare.vn' THEN 'Chủ cửa hàng'
    WHEN u.email = 'manager@motocare.vn' THEN 'Quản lý'
    ELSE 'Nhân viên'
  END as full_name
FROM auth.users u
WHERE u.email IN ('owner@motocare.vn', 'manager@motocare.vn', 'staff@motocare.vn')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;
```

### Lỗi 4: "Row Level Security policy violation"

**Nguyên nhân:** RLS policies chặn

**Fix:**

```sql
-- Kiểm tra RLS đã enable chưa:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- Nếu rowsecurity = false → Enable:
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📋 CHECKLIST CUỐI CÙNG

Trước khi test, đảm bảo:

- [ ] Supabase credentials trong .env
- [ ] Đã chạy auth_setup.sql
- [ ] Table user_profiles tồn tại
- [ ] Đã tạo 3 users trong Auth
- [ ] Users đã confirm email (✅)
- [ ] Đã update roles trong user_profiles
- [ ] Verify: SELECT \* FROM user_profiles; → Có 3 rows
- [ ] LoginPage đã update (import useAuth, gọi signIn)
- [ ] App compile không lỗi
- [ ] Browser console không có errors

---

## 🚀 QUICK START

**Nếu muốn test nhanh:**

```sql
-- 1. Chạy toàn bộ SQL này trong SQL Editor:

-- Tạo tables (nếu chưa có)
\i auth_setup.sql

-- 2. Sau đó chạy script này để tạo demo data:

-- Insert demo users vào user_profiles (manual)
-- (Thay YOUR_USER_ID bằng UUID thật từ auth.users)

INSERT INTO user_profiles (id, email, role, full_name, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'owner@motocare.vn', 'owner', 'Chủ cửa hàng', true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'manager@motocare.vn', 'manager', 'Quản lý', true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'staff@motocare.vn', 'staff', 'Nhân viên', true)
ON CONFLICT (email) DO NOTHING;
```

**Nhưng best practice:** Tạo users trong Auth UI, trigger sẽ tự tạo profiles.

---

**Sau khi làm xong các bước trên, login sẽ hoạt động!** ✅

Báo kết quả để mình biết bước nào bị stuck nhé!
