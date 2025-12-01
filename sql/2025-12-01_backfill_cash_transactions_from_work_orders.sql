-- =============================================================================
-- MIGRATION: Backfill cash_transactions from existing work_orders
-- Date: 2025-12-01
-- Purpose: Tạo các giao dịch thu chi từ phiếu sửa chữa đã thanh toán trước đây
-- =============================================================================

-- Bước 1: Xem trước dữ liệu sẽ được tạo (DRY RUN - không thay đổi gì)
-- Chạy query này trước để kiểm tra

SELECT 
    wo.id as work_order_id,
    wo.customername,
    wo.licenseplate,
    wo.total,
    wo.depositamount,
    wo.totalpaid,
    wo.paymentstatus,
    wo.paymentmethod,
    wo.branchid,
    wo.creationdate,
    wo.paymentdate,
    CASE 
        WHEN wo.depositamount > 0 THEN 'Cần tạo deposit transaction'
        ELSE 'Không có deposit'
    END as deposit_status,
    CASE 
        WHEN wo.totalpaid > COALESCE(wo.depositamount, 0) THEN 'Cần tạo payment transaction'
        ELSE 'Không có payment bổ sung'
    END as payment_status
FROM work_orders wo
WHERE (wo.totalpaid > 0 OR wo.depositamount > 0)
  AND wo.paymentstatus IN ('paid', 'partial')
ORDER BY wo.creationdate DESC;

-- =============================================================================
-- Bước 2: INSERT các deposit transactions (tiền đặt cọc)
-- =============================================================================

INSERT INTO cash_transactions (
    id,
    type,
    category,
    amount,
    date,
    description,
    branchid,
    paymentsource,
    workorderid,
    notes
)
SELECT 
    'BACKFILL-DEP-' || wo.id as id,
    'income' as type,
    'service_deposit' as category,
    wo.depositamount as amount,
    COALESCE(wo.depositdate, wo.creationdate) as date,
    'Đặt cọc sửa chữa - ' || wo.customername || ' - ' || COALESCE(wo.licenseplate, '') as description,
    COALESCE(wo.branchid, 'CN1') as branchid,
    COALESCE(wo.paymentmethod, 'cash') as paymentsource,
    wo.id as workorderid,
    '[BACKFILL] Tạo tự động từ dữ liệu phiếu sửa chữa cũ' as notes
FROM work_orders wo
WHERE wo.depositamount > 0
  AND wo.paymentstatus IN ('paid', 'partial')
  AND NOT EXISTS (
      SELECT 1 FROM cash_transactions ct 
      WHERE ct.workorderid = wo.id 
        AND ct.category = 'service_deposit'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Bước 3: INSERT các payment transactions (tiền thanh toán)
-- Số tiền = totalpaid - depositamount (phần thanh toán sau khi trừ cọc)
-- =============================================================================

INSERT INTO cash_transactions (
    id,
    type,
    category,
    amount,
    date,
    description,
    branchid,
    paymentsource,
    workorderid,
    notes
)
SELECT 
    'BACKFILL-PAY-' || wo.id as id,
    'income' as type,
    'service_income' as category,
    (wo.totalpaid - COALESCE(wo.depositamount, 0)) as amount,
    COALESCE(wo.paymentdate, wo.creationdate) as date,
    'Thu tiền sửa chữa - ' || wo.customername || ' - ' || COALESCE(wo.licenseplate, '') as description,
    COALESCE(wo.branchid, 'CN1') as branchid,
    COALESCE(wo.paymentmethod, 'cash') as paymentsource,
    wo.id as workorderid,
    '[BACKFILL] Tạo tự động từ dữ liệu phiếu sửa chữa cũ' as notes
FROM work_orders wo
WHERE wo.totalpaid > COALESCE(wo.depositamount, 0)
  AND wo.paymentstatus IN ('paid', 'partial')
  AND NOT EXISTS (
      SELECT 1 FROM cash_transactions ct 
      WHERE ct.workorderid = wo.id 
        AND ct.category = 'service_income'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Bước 4: Kiểm tra kết quả
-- =============================================================================

-- Đếm số giao dịch đã tạo
SELECT 
    'Deposit transactions' as type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM cash_transactions 
WHERE id LIKE 'BACKFILL-DEP-%'

UNION ALL

SELECT 
    'Payment transactions' as type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM cash_transactions 
WHERE id LIKE 'BACKFILL-PAY-%';

-- Xem chi tiết các giao dịch vừa tạo
SELECT 
    id,
    type,
    category,
    amount,
    date,
    description,
    branchid,
    paymentsource,
    workorderid
FROM cash_transactions
WHERE id LIKE 'BACKFILL-%'
ORDER BY date DESC;

-- =============================================================================
-- Bước 5 (TÙY CHỌN): Rollback nếu cần
-- Chạy query này nếu muốn xóa tất cả giao dịch backfill
-- =============================================================================

-- DELETE FROM cash_transactions WHERE id LIKE 'BACKFILL-%';
