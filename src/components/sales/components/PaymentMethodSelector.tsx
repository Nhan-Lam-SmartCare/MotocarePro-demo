import React from "react";
import { CreditCard, Banknote, Wallet, FileText } from "lucide-react";
import { NumberInput } from "../../common/NumberInput";
import { formatCurrency } from "../../../utils/format";

interface PaymentMethodSelectorProps {
    paymentMethod: "cash" | "bank" | null;
    paymentType: "full" | "partial" | "note" | null;
    partialAmount: number;
    total: number;
    onPaymentMethodChange: (method: "cash" | "bank") => void;
    onPaymentTypeChange: (type: "full" | "partial" | "note") => void;
    onPartialAmountChange: (amount: number) => void;
}

/**
 * Payment method and type selector component
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    paymentMethod,
    paymentType,
    partialAmount,
    total,
    onPaymentMethodChange,
    onPaymentTypeChange,
    onPartialAmountChange,
}) => {
    return (
        <div className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onPaymentMethodChange("cash")}
                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${paymentMethod === "cash"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                            }`}
                    >
                        <Banknote className="w-6 h-6" />
                        <span className="font-medium">Tiền mặt</span>
                    </button>
                    <button
                        onClick={() => onPaymentMethodChange("bank")}
                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${paymentMethod === "bank"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                            }`}
                    >
                        <CreditCard className="w-6 h-6" />
                        <span className="font-medium">Chuyển khoản</span>
                    </button>
                </div>
            </div>

            {/* Payment Type Selection (if method selected) */}
            {paymentMethod && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Hình thức thanh toán
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onPaymentTypeChange("full")}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all text-xs ${paymentType === "full"
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                    : "border-slate-200 dark:border-slate-700 hover:border-green-300"
                                }`}
                        >
                            <Wallet className="w-5 h-5" />
                            <span className="font-medium">Toàn bộ</span>
                        </button>
                        <button
                            onClick={() => onPaymentTypeChange("partial")}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all text-xs ${paymentType === "partial"
                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                    : "border-slate-200 dark:border-slate-700 hover:border-amber-300"
                                }`}
                        >
                            <Banknote className="w-5 h-5" />
                            <span className="font-medium">Trả góp</span>
                        </button>
                        <button
                            onClick={() => onPaymentTypeChange("note")}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all text-xs ${paymentType === "note"
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                    : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">Ghi nợ</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Partial Amount Input */}
            {paymentType === "partial" && (
                <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Số tiền trả trước
                    </label>
                    <NumberInput
                        value={partialAmount}
                        onChange={onPartialAmountChange}
                        min={0}
                        max={total}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Còn lại:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(total - partialAmount)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
