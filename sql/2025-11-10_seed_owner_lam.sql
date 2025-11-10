-- Seed owner role for lam.tcag@gmail.com (chạy sau khi đã tạo user trong Auth)
DO $$
DECLARE
  target_table text;
  uid uuid;
BEGIN
  -- Xác định bảng profile thực tế
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    target_table := 'profiles';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles') THEN
    target_table := 'user_profiles';
  ELSE
    RAISE NOTICE 'Không có bảng profiles hay user_profiles';
    RETURN;
  END IF;

  -- Lấy id người dùng từ auth.users
  SELECT id INTO uid FROM auth.users WHERE email = 'lam.tcag@gmail.com';
  IF uid IS NULL THEN
    RAISE NOTICE 'User lam.tcag@gmail.com chưa tồn tại trong auth.users';
    RETURN;
  END IF;

  -- Upsert dòng profile với role owner
  EXECUTE format('INSERT INTO public.%I (id, email, role, branch_id) VALUES ($1,$2,$3,$4)
                  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, branch_id = EXCLUDED.branch_id', target_table)
  USING uid, 'lam.tcag@gmail.com', 'owner', 'CN1';

  RAISE NOTICE 'Đã gán role owner cho lam.tcag@gmail.com';
END$$;