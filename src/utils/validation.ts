export interface PriceQtyValidationResult {
  ok: boolean;
  warnings: string[];
  clean: { importPrice: number; quantity: number };
}

const MAX_PRICE = 50_000_000; // 50 triệu
const MAX_QTY = 10_000;

export function validatePriceAndQty(
  importPrice: number,
  quantity: number
): PriceQtyValidationResult {
  const warnings: string[] = [];
  let price = Math.max(0, Math.round(importPrice));
  let qty = Math.max(0, Math.round(quantity));
  if (price > MAX_PRICE) {
    warnings.push("Giá nhập quá lớn (>50 triệu) đã được giới hạn.");
    price = MAX_PRICE;
  }
  if (qty > MAX_QTY) {
    warnings.push("Số lượng quá lớn (>10,000) đã được giới hạn.");
    qty = MAX_QTY;
  }
  return { ok: true, warnings, clean: { importPrice: price, quantity: qty } };
}
