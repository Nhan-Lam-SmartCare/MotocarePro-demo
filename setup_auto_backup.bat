@echo off
:: ============================================================================
:: THIẾT LẬP SAO LƯU TỰ ĐỘNG HÀNG NGÀY CHO MOTOCARE (12:00 & 17:00)
:: Tập lệnh này thiết lập 2 khung giờ sao lưu tự động hàng ngày
:: ============================================================================

echo Dang thiet lap lich sao luu tu dong (Windows Task Scheduler)...

set SCRIPT_PATH=%~dp0scripts\maintenance\export-all-tables.mjs

:: Task 1: 12:00 TRƯA
schtasks /create /tn "Motocare_Auto_Backup_12h" /tr "node \"%SCRIPT_PATH%\"" /sc daily /st 12:00 /f

:: Task 2: 17:00 CHIỀU
schtasks /create /tn "Motocare_Auto_Backup_17h" /tr "node \"%SCRIPT_PATH%\"" /sc daily /st 17:00 /f

if %errorlevel% equ 0 (
    echo.
    echo ============================================================================
    echo [OK] Da thiet lap 2 khung gio sao luu tu dong thanh cong!
    echo - KHUNG 1: 12:00 Trưa hang ngay
    echo - KHUNG 2: 17:00 Chieu hang ngay
    echo File sao luu se duoc luu tu dong vao thu muc "backups".
    echo ============================================================================
) else (
    echo.
    echo [LOI] Khong the thiet lap Task Scheduler. Vui long chay bat bang quyen Administrator.
)
