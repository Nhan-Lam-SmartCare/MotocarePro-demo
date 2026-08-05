# Hướng Dẫn & Script Sao Lưu - Dự Phòng Supabase 0$

Tài liệu này hướng dẫn cách tạo và quản lý **Dự án Supabase thứ 2 (Backup Standby Project)** để khi Dự án Supabase chính bị khóa do chạm hạn ngạch 5GB Egress, bạn có thể chuyển toàn bộ hoạt động sang Dự án thứ 2 chỉ trong 3 phút mà **không tốn bất kỳ chi phí nào ($0)**.

---

## 🛠️ Bước 1: Tạo Dự án Supabase Miễn phí thứ 2 (Standby)
1. Đăng ký tài khoản Supabase thứ 2 (dùng Google account khác) tại [supabase.com](https://supabase.com).
2. Tạo 1 Project mới (Ví dụ tên: `Motocare-Backup`).
3. Lấy 2 giá trị sau trong phần **Project Settings > API**:
   - `Project URL`
   - `anon / public key`

---

## 🛠️ Bước 2: Cấu hình Dự phòng vào file `.env`
Mở file `.env` trong dự án `Motocare` và thêm các dòng cấu hình dự phòng:

```env
# DỰ ÁN DỰ PHÒNG (BACKUP STANDBY)
VITE_SUPABASE_URL_BACKUP=https://YOUR-BACKUP-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY_BACKUP=eyJhbGci...YOUR-BACKUP-ANON-KEY
```

---

## 🛠️ Bước 3: Sao lưu & Đồng bộ dữ liệu ($0 Data Sync)

### Cách A: Sao lưu nhanh từ Supabase Dashboard (Không cần cài phần mềm)
1. Truy cập **Project Settings > Database** trên Supabase Dự án Chính.
2. Xuất dữ liệu bằng **Database Backups** hoặc dùng **Table Editor** > bấm **Export to CSV** các bảng quan trọng (`customers`, `parts`, `work_orders`, `sales`, `cash_transactions`, `suppliers`, `categories`).
3. Vào Dự án Supabase Dự phòng mới, chạy file SQL Migration từ thư mục `sql/` của Motocare để tạo lại các bảng.
4. Import lại dữ liệu đã Export.

### Cách B: Chạy lệnh Sao lưu nhanh với Supabase CLI / PostgreSQL (Chỉ 1 câu lệnh)
Nếu đã có PostgreSQL / Supabase CLI trên máy:

```bash
# 1. Export dữ liệu từ Dự án chính (V1)
pg_dump "postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-V1-ID].supabase.co:5432/postgres" --clean > motocare_backup.sql

# 2. Restore sang Dự án dự phòng (V2)
psql "postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-V2-ID].supabase.co:5432/postgres" < motocare_backup.sql
```

---

## ⚡ Khi bị khóa Quota: Chuyển vùng dự phòng 1-Click

Khi ứng dụng phát hiện Supabase bị ngắt Egress:
1. Màn hình ứng dụng sẽ tự động hiển thị **Thanh cảnh báo màu cam** ở phía trên cùng.
2. Bấm nút **"Chuyển sang Supabase Dự Phòng (V2)"**.
3. Ứng dụng sẽ tự tải lại và kết nối mượt mà tới Database dự phòng mà không mất dữ liệu hay tốn tiền!
