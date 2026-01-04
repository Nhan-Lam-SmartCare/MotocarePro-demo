-- =====================================================
-- CÔNG CỤ TÍNH SỐ DƯ BAN ĐẦU CHO NGUỒN TIỀN CHUNG
-- =====================================================
-- Sử dụng khi Motocare và Pin Factory dùng chung 1 nguồn tiền thực tế

-- BƯỚC 1: ĐIỀN SỐ TIỀN THỰC TẾ HIỆN CÓ
-- =====================================
-- Kiểm tra két tiền và sao kê ngân hàng, điền vào đây:

DO $$
DECLARE
    -- ⚠️ THAY ĐỔI SỐ TIỀN NÀY THEO THỰC TẾ
    tien_mat_thuc_te NUMERIC := 50000000;    -- Tiền mặt trong két (VD: 50 triệu)
    ngan_hang_thuc_te NUMERIC := 30000000;   -- Số dư ngân hàng (VD: 30 triệu)
    
    -- Biến động từ Motocare (lấy từ màn hình Tổng hợp Tài chính)
    motocare_cash_delta NUMERIC := -137378185;   -- Tiền mặt Motocare
    motocare_bank_delta NUMERIC := -77247277;    -- Ngân hàng Motocare
    
    -- Biến động từ Pin Factory (lấy từ màn hình Tổng hợp Tài chính)
    pin_cash_delta NUMERIC := -171040678;        -- Tiền mặt Pin
    pin_bank_delta NUMERIC := 0;                 -- Ngân hàng Pin
    
    -- Kết quả
    cash_initial NUMERIC;
    bank_initial NUMERIC;
BEGIN
    -- Tính số dư ban đầu cần thiết lập cho Motocare
    -- (Pin Factory sẽ = 0 vì dùng chung nguồn tiền)
    cash_initial := tien_mat_thuc_te - (motocare_cash_delta + pin_cash_delta);
    bank_initial := ngan_hang_thuc_te - (motocare_bank_delta + pin_bank_delta);
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'KẾT QUẢ TÍNH TOÁN';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Tiền mặt thực tế hiện có: % đ', TO_CHAR(tien_mat_thuc_te, 'FM999,999,999,999');
    RAISE NOTICE 'Ngân hàng thực tế hiện có: % đ', TO_CHAR(ngan_hang_thuc_te, 'FM999,999,999,999');
    RAISE NOTICE '';
    RAISE NOTICE 'Biến động tiền mặt (Motocare + Pin): % đ', TO_CHAR(motocare_cash_delta + pin_cash_delta, 'FM999,999,999,999');
    RAISE NOTICE 'Biến động ngân hàng (Motocare + Pin): % đ', TO_CHAR(motocare_bank_delta + pin_bank_delta, 'FM999,999,999,999');
    RAISE NOTICE '';
    RAISE NOTICE '👉 SỐ DƯ BAN ĐẦU CẦN THIẾT LẬP CHO MOTOCARE:';
    RAISE NOTICE '   Tiền mặt: % đ', TO_CHAR(cash_initial, 'FM999,999,999,999');
    RAISE NOTICE '   Ngân hàng: % đ', TO_CHAR(bank_initial, 'FM999,999,999,999');
    RAISE NOTICE '====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Sau khi thiết lập, số dư sẽ hiển thị đúng:';
    RAISE NOTICE '   Tổng = % đ', TO_CHAR(tien_mat_thuc_te + ngan_hang_thuc_te, 'FM999,999,999,999');
END $$;

-- =====================================================
-- BƯỚC 2: CẬP NHẬT SỐ DƯ BAN ĐẦU CHO MOTOCARE
-- =====================================================
-- Sau khi chạy script trên để biết số cần thiết lập,
-- THAY SỐ bên dưới và chạy lệnh UPDATE

-- ⚠️ THAY ĐỔI SỐ TIỀN THEO KẾT QUẢ TÍNH Ở TRÊN
UPDATE payment_sources 
SET 
  balance = jsonb_set(balance, '{CN1}', '358418863', true),  -- Số tiền mặt ban đầu
  updated_at = NOW()
WHERE id = 'cash';

UPDATE payment_sources 
SET 
  balance = jsonb_set(balance, '{CN1}', '107247277', true),  -- Số ngân hàng ban đầu
  updated_at = NOW()
WHERE id = 'bank';

-- Kiểm tra kết quả
SELECT 
  id,
  name,
  balance->>'CN1' as so_du_ban_dau,
  TO_CHAR((balance->>'CN1')::numeric, 'FM999,999,999,999') as formatted
FROM payment_sources
WHERE id IN ('cash', 'bank');
