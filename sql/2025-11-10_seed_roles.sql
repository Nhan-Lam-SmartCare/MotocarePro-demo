-- Seed vai trò và branch_id cho các tài khoản (CHỈ CHẠY MỘT LẦN / có thể chỉnh sửa rồi chạy lại an toàn)
-- THAY ĐỔI các email mẫu bên dưới cho đúng email tài khoản trong bảng profiles hoặc user_profiles.
-- Script sẽ tự phát hiện dùng bảng 'profiles' hay 'user_profiles'.

DO $$
DECLARE
  target_table text;
BEGIN
  -- Xác định bảng hồ sơ thực tế
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    target_table := 'profiles';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles') THEN
    target_table := 'user_profiles';
  ELSE
    RAISE NOTICE 'Không tìm thấy bảng profiles hoặc user_profiles – bỏ qua seed.';
    RETURN;
  END IF;

  -- Đảm bảo cột role và branch_id tồn tại (đề phòng chưa chạy script trước đó)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=target_table AND column_name='role'
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN role text', target_table);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=target_table AND column_name='branch_id'
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN branch_id text', target_table);
  END IF;

  -- OWNER (toàn quyền)
  EXECUTE format(
    'UPDATE public.%I SET role=%L, branch_id=%L WHERE lower(email)=lower(%L) AND (role IS DISTINCT FROM %L OR branch_id IS DISTINCT FROM %L)',
    target_table,
    'owner','CN1','nhanxn@gmail.com','owner','CN1'
  );

  -- MANAGER (quản lý)
  EXECUTE format(
    'UPDATE public.%I SET role=%L, branch_id=%L WHERE lower(email)=lower(%L) AND (role IS DISTINCT FROM %L OR branch_id IS DISTINCT FROM %L)',
    target_table,
    'manager','CN1','truongcuongya123@gmail.com','manager','CN1'
  );

  -- STAFF (nhân viên)
  EXECUTE format(
    'UPDATE public.%I SET role=%L, branch_id=%L WHERE lower(email)=lower(%L) AND (role IS DISTINCT FROM %L OR branch_id IS DISTINCT FROM %L)',
    target_table,
    'staff','CN1','nguyenthanhloc28052007@gmail.com','staff','CN1'
  );

  RAISE NOTICE 'Seed roles hoàn tất (hãy thay email placeholder cho đúng trước khi chạy ở môi trường thật).';
END$$;

-- Sau khi chạy xong: kiểm tra nhanh
-- SELECT email, role, branch_id FROM public.profiles LIMIT 10;  -- hoặc user_profiles