import React from "react";
import { X, History, Banknote, CreditCard } from "lucide-react";
import { formatCurrency } from "../../../utils/format";
import type {
  CustomerDebt,
  DebtPaymentEntry,
  SupplierDebt,
} from "../../../types";

interface Props {
  debt: CustomerDebt | SupplierDebt;
  type: "customer" | "supplier";
  onClose: () => void;
}

export const DebtHistoryModal: React.FC<Props> = ({ debt, type, onClose }) => {
  const targetName =
    type === "customer"
      ? (debt as CustomerDebt).customerName
      : (debt as SupplierDebt).supplierName;

  const history = debt.paymentHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Lịch sử thanh toán</h3>
              <p className="text-xs text-slate-400 font-medium">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5 space-y-0.5">
            <div className="text-slate-400">Tổng nợ</div>
            <div className="font-black text-white">{formatCurrency(debt.totalAmount)}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 space-y-0.5">
            <div className="text-emerald-400">Đã trả</div>
            <div className="font-black text-emerald-300">{formatCurrency(debt.paidAmount)}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 space-y-0.5">
            <div className="text-red-400">Còn nợ</div>
            <div className="font-black text-red-300">{formatCurrency(debt.remainingAmount)}</div>
          </div>
        </div>

        {/* History list */}
        <div className="p-5 max-h-[400px] overflow-y-auto space-y-2.5">
          {history.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Chưa có lịch sử thanh toán</p>
              <p className="text-xs text-slate-600 mt-1">Các đợt thu/trả nợ sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            history
              .slice()
              .reverse()
              .map((entry: DebtPaymentEntry, idx: number) => {
                const date = entry.date
                  ? new Date(entry.date).toLocaleString("vi-VN")
                  : "--";
                const method = entry.method === "bank" ? "bank" : "cash";

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        method === "bank"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {method === "bank" ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Banknote className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-emerald-400">
                          +{formatCurrency(entry.amount)}
                        </span>
                        <span className="text-[11px] text-slate-500 shrink-0">{date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {method === "bank" ? "Chuyển khoản" : "Tiền mặt"}
                        {entry.staffName && (
                          <span className="ml-2 text-slate-500">• NV: {entry.staffName}</span>
                        )}
                      </div>
                      {entry.note && (
                        <div className="text-[11px] text-slate-500 mt-1 italic">{entry.note}</div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtHistoryModal;
