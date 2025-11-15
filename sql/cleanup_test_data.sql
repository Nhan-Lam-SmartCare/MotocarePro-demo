-- ============================================
-- SCRIPT XÓA DỮ LIỆU TEST
-- Chạy script này để reset dữ liệu về trạng thái sạch
-- ============================================

-- 1. Xóa công nợ khách hàng
DELETE FROM customer_debts;

-- 2. Xóa công nợ nhà cung cấp
DELETE FROM supplier_debts;

-- 3. Xóa phiếu sửa chữa
DELETE FROM work_orders;

-- 4. Xóa giao dịch tiền mặt liên quan (nếu muốn reset hoàn toàn)
DELETE FROM cash_transactions 
WHERE category IN ('service_deposit', 'service_income', 'service_refund');

-- 5. Xóa giao dịch kho liên quan đến phiếu sửa chữa
DELETE FROM inventory_transactions 
WHERE "workOrderId" IS NOT NULL;

-- 6. Reset số dư kho về ban đầu (tùy chọn - nếu muốn reset stock)
-- Nếu bạn đã xuất phụ tùng cho phiếu sửa chữa, cần cộng lại vào kho
-- UPDATE parts SET quantity = quantity + [số lượng đã xuất]
-- Hoặc đơn giản hơn: backup và restore lại parts table

-- ============================================
-- VERIFY KẾT QUẢ
-- ============================================
SELECT 'customer_debts' as table_name, COUNT(*) as count FROM customer_debts
UNION ALL
SELECT 'supplier_debts', COUNT(*) FROM supplier_debts
UNION ALL
SELECT 'work_orders', COUNT(*) FROM work_orders
UNION ALL
SELECT 'cash_transactions (service)', COUNT(*) FROM cash_transactions WHERE category LIKE 'service%'
UNION ALL
SELECT 'inventory_transactions (work_order)', COUNT(*) FROM inventory_transactions WHERE "workOrderId" IS NOT NULL;

-- ============================================
-- CẢNH BÁO
-- ============================================
-- Script này sẽ XÓA VĨNH VIỄN dữ liệu!
-- Đảm bảo bạn đã backup trước khi chạy!
-- Nếu muốn giữ dữ liệu cũ, hãy export trước:
-- pg_dump -h localhost -U postgres -d motocare -t customer_debts > backup_customer_debts.sql
-- pg_dump -h localhost -U postgres -d motocare -t work_orders > backup_work_orders.sql
