-- FIX RLS cho Pin Factory Database
-- Chạy script này trên Supabase SQL Editor của Pin Factory
-- URL: https://jvigqtcbtzaxmrdsbfru.supabase.co

-- OPTION 1: TẮT RLS HOÀN TOÀN (ĐƠN GIẢN NHẤT)
ALTER TABLE public.cashtransactions DISABLE ROW LEVEL SECURITY;

-- Kiểm tra RLS đã tắt
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'cashtransactions';

-- OPTION 2: GIỮ RLS NHƯNG CHO PHÉP PUBLIC ĐỌC/GHI (NẾU MUỐN BẢO MẬT HƠN)
/*
-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Allow public read access" ON public.cashtransactions;
DROP POLICY IF EXISTS "Allow public write access" ON public.cashtransactions;

-- Tạo policy cho phép đọc
CREATE POLICY "Allow public read access"
ON public.cashtransactions
FOR SELECT
TO public
USING (true);

-- Tạo policy cho phép ghi
CREATE POLICY "Allow public write access"
ON public.cashtransactions
FOR INSERT
TO public
WITH CHECK (true);

-- Tạo policy cho phép update
CREATE POLICY "Allow public update access"
ON public.cashtransactions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Tạo policy cho phép delete
CREATE POLICY "Allow public delete access"
ON public.cashtransactions
FOR DELETE
TO public
USING (true);
*/

-- Kiểm tra dữ liệu có đọc được không
SELECT COUNT(*) as total_transactions FROM public.cashtransactions;

-- Xem 5 giao dịch gần nhất
SELECT * FROM public.cashtransactions ORDER BY date DESC LIMIT 5;
