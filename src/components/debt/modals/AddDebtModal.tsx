import React, { useState } from "react";
import { X, Plus, Calendar, User, Building2, Phone, Car } from "lucide-react";
import FormattedNumberInput from "../../common/FormattedNumberInput";
import { formatCurrency } from "../../../utils/format";
import { showToast } from "../../../utils/toast";

interface AddDebtModalProps {
  activeTab: "customer" | "supplier";
  customers: any[];
  suppliers: any[];
  currentBranchId: string;
  onClose: () => void;
  onSave: (debt: any) => void | Promise<void>;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  activeTab,
  customers,
  suppliers,
  currentBranchId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    customerId: "",
    supplierId: "",
    description: "",
    totalAmount: 0,
    phone: "",
    licensePlate: "",
    vehicleModel: "",
    dueDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const isCustomer = activeTab === "customer";

  const setField = (patch: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (formData.totalAmount <= 0) {
      showToast.error("Vui lòng nhập số tiền nợ lớn hơn 0 đ");
      return;
    }

    let payload: any;

    if (isCustomer) {
      const customer = customers.find((c) => c.id === formData.customerId);
      if (!customer) {
        showToast.error("Vui lòng chọn khách hàng");
        return;
      }

      payload = {
        customerId: formData.customerId,
        customerName: customer.name,
        phone: formData.phone || customer.phone,
        licensePlate: formData.licensePlate || customer.licensePlate,
        vehicleModel: formData.vehicleModel || customer.vehicleModel,
        description: formData.description,
        totalAmount: formData.totalAmount,
        paidAmount: 0,
        remainingAmount: formData.totalAmount,
        createdDate: new Date().toISOString(),
        dueDate: formData.dueDate || undefined,
        branchId: currentBranchId,
      };
    } else {
      const supplier = suppliers.find((s) => s.id === formData.supplierId);
      if (!supplier) {
        showToast.error("Vui lòng chọn nhà cung cấp");
        return;
      }

      payload = {
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        phone: formData.phone || supplier.phone,
        description: formData.description,
        totalAmount: formData.totalAmount,
        paidAmount: 0,
        remainingAmount: formData.totalAmount,
        createdDate: new Date().toISOString(),
        dueDate: formData.dueDate || undefined,
        branchId: currentBranchId,
      };
    }

    try {
      setIsSaving(true);
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isCustomer
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}
            >
              {isCustomer ? (
                <User className="w-5 h-5" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Thêm công nợ {isCustomer ? "khách hàng" : "nhà cung cấp"}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Ghi nhận khoản nợ mới cho chi nhánh {currentBranchId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Đối tượng nợ */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isCustomer ? "Khách hàng" : "Nhà cung cấp"}{" "}
              <span className="text-red-400">*</span>
            </label>
            {isCustomer ? (
              <select
                value={formData.customerId}
                onChange={(e) => setField({ customerId: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">Chọn khách hàng...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` - ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={formData.supplierId}
                onChange={(e) => setField({ supplierId: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">Chọn nhà cung cấp...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SĐT + biển số / dòng xe */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Số điện thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setField({ phone: e.target.value })}
                placeholder="Tự lấy theo hồ sơ nếu bỏ trống"
                className={inputClass}
              />
            </div>

            {isCustomer ? (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-500" /> Biển số xe
                </label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) =>
                    setField({ licensePlate: e.target.value.toUpperCase() })
                  }
                  placeholder="VD: 59H1-234.56"
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Hạn trả
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setField({ dueDate: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {isCustomer && (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-500" /> Dòng xe
              </label>
              <input
                type="text"
                value={formData.vehicleModel}
                onChange={(e) => setField({ vehicleModel: e.target.value })}
                placeholder="VD: Air Blade 125"
                className={inputClass}
              />
            </div>
          )}

          {/* Nội dung */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nội dung công nợ <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setField({ description: e.target.value })}
              required
              rows={2}
              placeholder="VD: Thay nhớt + lọc gió, khách nợ lại..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Số tiền */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Số tiền nợ (đ) <span className="text-red-400">*</span>
            </label>
            <FormattedNumberInput
              value={formData.totalAmount}
              onValue={(val) =>
                setField({ totalAmount: Math.max(0, Math.round(val)) })
              }
              className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-right font-bold text-red-400 text-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {[
                { label: "100k", val: 100000 },
                { label: "200k", val: 200000 },
                { label: "500k", val: 500000 },
                { label: "1 triệu", val: 1000000 },
                { label: "2 triệu", val: 2000000 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() =>
                    setField({ totalAmount: formData.totalAmount + btn.val })
                  }
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-semibold transition-colors"
                >
                  +{btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setField({ totalAmount: 0 })}
                className="px-2 py-1 text-[11px] rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 font-semibold transition-colors"
              >
                Xóa
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Thành tiền: {formatCurrency(formData.totalAmount || 0)}
            </p>
          </div>

          {/* Hạn trả (khách hàng) */}
          {isCustomer && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" /> Ngày hẹn trả (để
                nhắc nhở)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setField({ dueDate: e.target.value })}
                className="w-full h-10 px-3 bg-slate-900 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-amber-300/70">Hẹn nhanh:</span>
                {[
                  { label: "+3 ngày", days: 3 },
                  { label: "+7 ngày", days: 7 },
                  { label: "+15 ngày", days: 15 },
                  { label: "+30 ngày", days: 30 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + preset.days);
                      setField({ dueDate: d.toISOString().slice(0, 10) });
                    }}
                    className="px-2 py-1 text-[11px] rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-1 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? "Đang lưu..." : "Thêm công nợ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebtModal;
