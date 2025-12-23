import React from 'react';
import { Truck } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

interface DeliveryFormSectionProps {
    deliveryMethod: 'pickup' | 'delivery';
    setDeliveryMethod: (method: 'pickup' | 'delivery') => void;
    deliveryAddress: string;
    setDeliveryAddress: (address: string) => void;
    deliveryPhone: string;
    setDeliveryPhone: (phone: string) => void;
    shippingFee: number;
    setShippingFee: (fee: number) => void;
    deliveryNote: string;
    setDeliveryNote: (note: string) => void;
    trackingNumber: string;
    setTrackingNumber: (tracking: string) => void;
    total: number;
}

/**
 * Delivery Form Section for Sales
 * Allows users to choose between pickup and delivery
 * Shows delivery form fields when delivery is selected
 */
export const DeliveryFormSection: React.FC<DeliveryFormSectionProps> = ({
    deliveryMethod,
    setDeliveryMethod,
    deliveryAddress,
    setDeliveryAddress,
    deliveryPhone,
    setDeliveryPhone,
    shippingFee,
    setShippingFee,
    deliveryNote,
    setDeliveryNote,
    trackingNumber,
    setTrackingNumber,
    total,
}) => {
    return (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 md:p-4 bg-slate-50 dark:bg-slate-800/50">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                🚚 Giao hàng
            </h4>

            {/* Radio: Pickup vs Delivery */}
            <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        onChange={() => setDeliveryMethod('pickup')}
                        className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">🏪 Tự lấy</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        value="delivery"
                        checked={deliveryMethod === 'delivery'}
                        onChange={() => setDeliveryMethod('delivery')}
                        className="w-4 h-4 text-orange-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">🚚 Giao hàng</span>
                </label>
            </div>

            {/* Delivery Fields - Show only if delivery selected */}
            {deliveryMethod === 'delivery' && (
                <div className="space-y-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    {/* Address */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Địa chỉ giao hàng <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Nhập địa chỉ giao hàng"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            SĐT nhận hàng
                        </label>
                        <input
                            type="tel"
                            value={deliveryPhone}
                            onChange={(e) => setDeliveryPhone(e.target.value)}
                            placeholder="Số điện thoại"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Shipping Fee */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Phí ship
                        </label>
                        <input
                            type="number"
                            value={shippingFee || ''}
                            onChange={(e) => setShippingFee(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Ghi chú
                        </label>
                        <textarea
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            placeholder="Ghi chú giao hàng (tùy chọn)"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                        />
                    </div>

                    {/* Tracking Number - NEW */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Mã bưu phẩm (GHN, GHTK...)
                        </label>
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Nhập mã vận đơn nếu có"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                    </div>

                    {/* COD Display */}
                    <div className="pt-2 border-t border-orange-300 dark:border-orange-700">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                COD cần thu:
                            </span>
                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(total + shippingFee)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            = Tổng đơn ({formatCurrency(total)}) + Phí ship ({formatCurrency(shippingFee)})
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
