import React, { useState } from "react";
import { useCategories, useCreateCategory } from "../../../hooks/useCategories";
import { showToast } from "../../../utils/toast";
import FormattedNumberInput from "../../common/FormattedNumberInput";
import { validatePriceAndQty } from "../../../utils/validation";

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    description: string;
    barcode: string;
    category: string;
    quantity: number;
    importPrice: number;
    retailPrice: number;
    warranty: number;
    warrantyUnit: string;
  }) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [importPrice, setImportPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [warranty, setWarranty] = useState<number>(0);
  const [warrantyUnit, setWarrantyUnit] = useState("tháng");
  const [retailOverridden, setRetailOverridden] = useState<boolean>(false);
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const [showInlineCat, setShowInlineCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast.warning("Vui lòng nhập tên sản phẩm");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      barcode: barcode.trim(),
      category: category || "Chưa phân loại",
      quantity: Number(quantity) || 1,
      importPrice: Number(importPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      warranty: Number(warranty) || 0,
      warrantyUnit,
    });

    // Reset form
    setName("");
    setDescription("");
    setBarcode("");
    setCategory("");
    setQuantity(1);
    setImportPrice(0);
    setRetailPrice(0);
    setWarranty(0);
    setRetailOverridden(false);
    setWarrantyUnit("tháng");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Thêm sản phẩm mới
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {/* Row 1: Tên sản phẩm + Danh mục */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục sản phẩm
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn hoặc tạo mới --</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowInlineCat(true)}
                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                    aria-label="Thêm danh mục mới"
                  >
                    <span className="text-lg text-slate-600 dark:text-slate-300">
                      +
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inline category form */}
            {showInlineCat && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const trimmed = inlineCatName.trim();
                  if (!trimmed) {
                    showToast.warning("Vui lòng nhập tên danh mục");
                    return;
                  }
                  if (trimmed.length < 2) {
                    showToast.warning("Tên quá ngắn");
                    return;
                  }
                  try {
                    const res = await createCategory.mutateAsync({
                      name: trimmed,
                    });
                    setCategory(res.name);
                    setInlineCatName("");
                    setShowInlineCat(false);
                  } catch (err: any) {
                    showToast.error(err?.message || "Lỗi tạo danh mục");
                  }
                }}
                className="flex gap-2"
              >
                <input
                  autoFocus
                  type="text"
                  value={inlineCatName}
                  onChange={(e) => setInlineCatName(e.target.value)}
                  placeholder="Nhập tên danh mục mới"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineCat(false);
                    setInlineCatName("");
                  }}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Hủy
                </button>
              </form>
            )}

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Mô tả sản phẩm"
              />
            </div>

            {/* Mã sản phẩm */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mã sản phẩm
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="VD: 06455-KYJ-841 (Honda), 5S9-F2101-00 (Yamaha)"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Nhập mã hãng (Honda/Yamaha) hoặc để trống để tự sinh mã nội bộ
                PT-xxxxx
              </p>
            </div>

            {/* Thông tin nhập kho - Compact Grid */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Thông tin nhập kho:
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Số lượng
                  </label>
                  <FormattedNumberInput
                    value={quantity}
                    onValue={(v) => {
                      const result = validatePriceAndQty(importPrice, v);
                      if (result.warnings.length)
                        result.warnings.forEach((w) => showToast.warning(w));
                      setQuantity(Math.max(1, result.clean.quantity));
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Giá nhập
                  </label>
                  <FormattedNumberInput
                    value={importPrice}
                    onValue={(v) => {
                      const result = validatePriceAndQty(v, quantity);
                      if (result.warnings.length)
                        result.warnings.forEach((w) => showToast.warning(w));
                      setImportPrice(result.clean.importPrice);
                      if (!retailOverridden) {
                        setRetailPrice(
                          Math.round(result.clean.importPrice * 1.5)
                        );
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Giá bán lẻ
                  </label>
                  <FormattedNumberInput
                    value={retailPrice}
                    onValue={(v) => {
                      setRetailPrice(Math.max(0, Math.round(v)));
                      setRetailOverridden(true);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Bảo hành
                  </label>
                  <FormattedNumberInput
                    value={warranty}
                    onValue={(v) => setWarranty(Math.max(0, Math.floor(v)))}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Đơn vị
                  </label>
                  <select
                    value={warrantyUnit}
                    onChange={(e) => setWarrantyUnit(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="tháng">tháng</option>
                    <option value="năm">năm</option>
                    <option value="ngày">ngày</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            Lưu và Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
