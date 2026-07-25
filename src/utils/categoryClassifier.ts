/**
 * Honda Spare Parts Category Classifier
 * Phân loại tự động sản phẩm vào hệ thống Nhóm Hàng Honda chính xác
 */

export function classifyHondaCategory(productName: string, sku: string = ''): { category: string; subCategory: string } {
    const name = (productName || '').toLowerCase();
    const s = (sku || '').toLowerCase();

    // 1. DẦU NHỚT - NƯỚC MÁT
    if (name.includes('nước làm mát') || name.includes('nước tản nhiệt')) {
        return { category: 'DẦU NHỚT - NƯỚC MÁT', subCategory: 'NƯỚC LÀM MÁT' };
    }
    if (name.includes('dầu hộp số') || name.includes('dầu nhớt') || name.includes('nhớt')) {
        return { category: 'DẦU NHỚT - NƯỚC MÁT', subCategory: 'DẦU NHỚT' };
    }
    if (name.includes('dầu phanh')) {
        return { category: 'DẦU NHỚT - NƯỚC MÁT', subCategory: 'DẦU PHANH' };
    }

    // 2. MÁ PHANH - HỆ THỐNG PHANH
    if (name.includes('má phanh') || name.includes('bố phanh')) {
        return { category: 'MÁ PHANH - GIẢM CHẤN', subCategory: 'MÁ PHANH' };
    }
    if (name.includes('đĩa phanh')) {
        return { category: 'HỆ THỐNG PHANH TRƯỚC', subCategory: 'ĐĨA PHANH' };
    }
    if (name.includes('ngàm phanh') || name.includes('piston ngàm phanh')) {
        return { category: 'HỆ THỐNG PHANH TRƯỚC', subCategory: 'NGÀM PHANH TRƯỚC' };
    }
    if (name.includes('xylanh phanh') || name.includes('dây phanh') || name.includes('thanh kéo phanh') || name.includes('bát phanh') || name.includes('cam phanh')) {
        return { category: 'HỆ THỐNG PHANH TRƯỚC', subCategory: 'LINH KIỆN HỆ THỐNG PHANH TRƯỚC' };
    }

    // 3. HỆ THỐNG CÔN - LY HỢP - TRỤC SỐ - BÁNH RĂNG
    if (name.includes('ly hợp') || name.includes('guốc văng') || name.includes('đĩa ma sát') || name.includes('nồi') || name.includes('côn')) {
        return { category: 'HỆ THỐNG CÔN - LY HỢP - TRỤC SỐ - BÁNH RĂNG', subCategory: 'CÔN - LY HỢP' };
    }
    if (name.includes('dây curoa') || name.includes('dây đai')) {
        return { category: 'HỆ THỐNG CÔN - LY HỢP - TRỤC SỐ - BÁNH RĂNG', subCategory: 'DÂY ĐAI CHUYỂN ĐỘNG - DÂY CUROA' };
    }
    if (name.includes('bi văng') || name.includes('đĩa nâng') || name.includes('kẹp trượt') || name.includes('đĩa ép')) {
        return { category: 'HỆ THỐNG CÔN - LY HỢP - TRỤC SỐ - BÁNH RĂNG', subCategory: 'LINH KIỆN HỆ THỐNG CÔN - LY HỢP - TRỤC SỐ - BÁNH RĂNG' };
    }

    // 4. NHÔNG XÍCH - NSD
    if (name.includes('xích cam') || name.includes('bánh dẫn xích cam') || name.includes('cần căng xích cam') || name.includes('bánh căng xích cam') || name.includes('lò xo căng xích cam')) {
        return { category: 'NHÔNG XÍCH - NSD', subCategory: 'XÍCH CAM' };
    }
    if (name.includes('nhông') || name.includes('xích') || name.includes('nsd') || name.includes('hộp xích')) {
        return { category: 'NHÔNG XÍCH - NSD', subCategory: 'NHÔNG SAU' };
    }

    // 5. GIẢM XÓC - THỤT - PHUỘC
    if (name.includes('giảm xóc sau') || name.includes('phuộc sau') || name.includes('thụt sau')) {
        return { category: 'GIẢM XÓC SAU - THỤT SAU', subCategory: 'GIẢM XÓC SAU' };
    }
    if (name.includes('giảm xóc') || name.includes('phuộc') || name.includes('thụt') || name.includes('phớt giảm xóc')) {
        return { category: 'GIẢM XÓC - THỤT - PHUỘC TRƯỚC', subCategory: 'GIẢM XÓC TRƯỚC' };
    }

    // 6. PHỚT - VÒNG BI
    if (name.includes('vòng bi') || name.includes('bạc đạn') || name.includes('phớt moay ơ') || name.includes('phớt dầu') || name.includes('phớt')) {
        return { category: 'PHỚT - VÒNG BI', subCategory: 'PHỚT' };
    }
    if (name.includes('bạc cách') || name.includes('moay ơ')) {
        return { category: 'HỆ THỐNG VÀNH TRƯỚC - BÁNH TRƯỚC', subCategory: 'MOAY Ơ TRƯỚC' };
    }

    // 7. HỆ THỐNG LỌC GIÓ - BÌNH XĂNG
    if (name.includes('lọc khí') || name.includes('lọc gió') || name.includes('tấm lọc') || name.includes('ống nối lọc khí')) {
        return { category: 'HỆ THỐNG LỌC GIÓ - BÌNH XĂNG', subCategory: 'LỌC GIÓ' };
    }

    // 8. CHẾ HOÀ KHÍ - BÌNH XĂNG CON - BƠM XĂNG
    if (name.includes('bơm xăng') || name.includes('phao xăng') || name.includes('lọc xăng') || name.includes('dây ga') || name.includes('van khóa xăng') || name.includes('nắp bình xăng') || name.includes('dây le')) {
        return { category: 'CHẾ HOÀ KHÍ - BÌNH XĂNG CON - BƠM XĂNG', subCategory: 'BƠM XĂNG' };
    }

    // 9. HỆ THỐNG PHÁT ĐIỆN
    if (name.includes('chỉnh lưu') || name.includes('tiết chế') || name.includes('mô bin') || name.includes('bu gi') || name.includes('bugi') || name.includes('của đề') || name.includes('ắc quy') || name.includes('cuộn điện') || name.includes('còi')) {
        return { category: 'HỆ THỐNG PHÁT ĐIỆN', subCategory: 'CUỘN ĐIỆN - MÁY PHÁT ĐIỆN' };
    }

    // 10. HỆ THỐNG ĐÈN
    if (name.includes('đèn') || name.includes('xi nhan') || name.includes('phản quang') || name.includes('bóng đèn')) {
        return { category: 'HỆ THỐNG ĐÈN', subCategory: 'ĐÈN PHA' };
    }

    // 11. HỆ THỐNG ỐNG XẢ - PÔ
    if (name.includes('ống xả') || name.includes('chắn nhiệt') || name.includes('cách nhiệt') || name.includes('pô') || name.includes('cổ pô')) {
        return { category: 'HỆ THỐNG ỐNG XẢ - PÔ', subCategory: 'ỐP ỐNG XẢ - ỐP PÔ' };
    }

    // 12. ĐỒNG HỒ CONTERMET
    if (name.includes('dây công tơ mét') || name.includes('đồng hồ') || name.includes('màn hình đo tốc độ')) {
        return { category: 'ĐỒNG HỒ CONTERMET', subCategory: 'MÀN HÌNH ĐO TỐC ĐỘ' };
    }

    // 13. GƯƠNG - KÍNH CHIẾU HẬU
    if (name.includes('gương') || name.includes('kính chiếu hậu')) {
        return { category: 'GƯƠNG - KÍNH CHIẾU HẬU', subCategory: 'GƯƠNG - KÍNH CHIẾU HẬU' };
    }

    // 14. LỐC MÁY - VÁCH MÁY - GIOĂNG MÁY
    if (name.includes('gioăng') || name.includes('lốc máy') || name.includes('xylanh') || name.includes('xéc măng') || name.includes('nắp máy') || name.includes('đầu quylát')) {
        return { category: 'LỐC MÁY -VÁCH MÁY - GIOĂNG MÁY', subCategory: 'GIOĂNG' };
    }

    // 15. HỆ THỐNG BƠM DẦU - LỌC DẦU
    if (name.includes('bơm dầu') || name.includes('lọc dầu') || name.includes('thước thăm dầu')) {
        return { category: 'HỆ THỐNG BƠM DẦU - LỌC DẦU', subCategory: 'BƠM DẦU' };
    }

    // 16. NHỰA XE - DÀN ÁO
    if (name.includes('yếm') || name.includes('ốp') || name.includes('nhựa') || name.includes('chắn bùn') || name.includes('mặt nạ') || name.includes('cốp') || name.includes('nắp tay lái') || name.includes('tem') || name.includes('biểu tượng')) {
        return { category: 'NHỰA XE - DÀN ÁO', subCategory: 'NHỰA CÁNH YẾM' };
    }

    // 17. KHUNG XE
    if (name.includes('tay dắt') || name.includes('chân chống') || name.includes('tay nắm') || name.includes('tay ga') || name.includes('tay phanh') || name.includes('gác chân') || name.includes('cao su')) {
        return { category: 'KHUNG XE', subCategory: 'CHÂN CHỐNG BÊN - CHỐNG NGHIÊNG' };
    }

    // 18. BỘ KHOÁ - CÔNG TẮC
    if (name.includes('khóa') || name.includes('khoá') || name.includes('pin(cr2032)') || name.includes('công tắc') || name.includes('chìa')) {
        return { category: 'BỘ KHOÁ - CÔNG TẮC', subCategory: 'BỘ KHOÁ ĐIỆN' };
    }

    // Default Fallback
    return { category: 'NHÓM PHỤ TÙNG HONDA', subCategory: 'LINH KIỆN KHÁC' };
}
