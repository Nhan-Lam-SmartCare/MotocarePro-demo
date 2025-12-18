import React, { useState } from "react";
import {
  X,
  Edit2,
  Save,
  XCircle,
  CheckCircle,
  Package,
  Trash2,
  FileCheck,
  Calendar,
  User,
  Building,
  FileText,
} from "lucide-react";
import {
  usePurchaseOrder,
  usePurchaseOrderItems,
  useUpdatePurchaseOrder,
  useUpdatePurchaseOrderItem,
  useConvertPOToReceipt,
} from "../../hooks/usePurchaseOrders";
import { formatCurrency, formatDate } from "../../utils/format";
import { showToast } from "../../utils/toast";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmModal from "../common/ConfirmModal";
import type {
  PurchaseOrder,
  UpdatePurchaseOrderInput,
  PurchaseOrderStatus,
} from "../../types";

interface PODetailViewProps {
  poId: string;
  onClose: () => void;
  onConverted?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Nháp",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: <FileText className="w-4 h-4" />,
  },
  ordered: {
    label: "Đã đặt",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  received: {
    label: "Đã nhận",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    icon: <Package className="w-4 h-4" />,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    icon: <XCircle className="w-4 h-4" />,
  },
};

export const PODetailView: React.FC<PODetailViewProps> = ({
  poId,
  onClose,
  onConverted,
}) => {
  const { data: po, isLoading: poLoading } = usePurchaseOrder(poId);
  const { data: items = [], isLoading: itemsLoading } =
    usePurchaseOrderItems(poId);
  const updatePOMutation = useUpdatePurchaseOrder();
  const updateItemMutation = useUpdatePurchaseOrderItem();
  const convertMutation = useConvertPOToReceipt();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [isEditingCosts, setIsEditingCosts] = useState(false);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editShipping, setEditShipping] = useState(0);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Initialize edit values when PO loads
  React.useEffect(() => {
    if (po) {
      setEditDiscount(po.discount_amount || 0);
      setEditShipping(po.shipping_fee || 0);
    }
  }, [po]);

  if (poLoading || itemsLoading || !po) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-500 font-medium">Đang tải thông tin đơn hàng...</div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;

  // Calculate amounts
  const totalAmount = po.total_amount || 0;
  const discountAmount = po.discount_amount || 0;
  const shippingFee = po.shipping_fee || 0;
  const finalAmount = po.final_amount || Math.max(0, totalAmount - discountAmount + shippingFee);

  const handleUpdateCosts = async () => {
    try {
      await updatePOMutation.mutateAsync({
        id: po.id,
        discount_amount: editDiscount,
        shipping_fee: editShipping,
      });
      showToast.success("Đã cập nhật chi phí");
      setIsEditingCosts(false);
    } catch (error) {
      console.error("Error updating costs:", error);
      showToast.error("Lỗi khi cập nhật chi phí");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    const update: UpdatePurchaseOrderInput = {
      id: po.id,
      status: status as PurchaseOrderStatus,
    };

    if (status === "cancelled") {
      const reason = prompt("Lý do hủy đơn:");
      if (!reason) return;
      update.cancellation_reason = reason;
    }

    try {
      await updatePOMutation.mutateAsync(update);
      showToast.success("Đã cập nhật trạng thái");
      setEditingStatus(false);
    } catch (error) {
      console.error("Error updating status:", error);
      showToast.error("Lỗi khi cập nhật trạng thái");
    }
  };



  const handleMarkAsOrdered = async () => {
    const confirmed = await confirm({
      title: "Xác nhận đặt hàng",
      message: "Xác nhận đơn hàng này đã được đặt với nhà cung cấp?",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      confirmColor: "blue",
    });

    if (confirmed) {
      await handleUpdateStatus("ordered");
    }
  };

  const handleConvertToReceipt = async () => {
    const confirmed = await confirm({
      title: "Nhập kho",
      message: "Xác nhận đã nhận hàng và tạo phiếu nhập kho?",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      confirmColor: "green",
    });

    if (confirmed) {
      try {
        await convertMutation.mutateAsync(po.id);
        showToast.success("Đã tạo phiếu nhập kho");
        onConverted?.();
        onClose();
      } catch (error) {
        console.error("Error converting PO:", error);
        showToast.error(
          error instanceof Error ? error.message : "Lỗi khi tạo phiếu nhập kho"
        );
      }
    }
  };

  const handleCancelPO = async () => {
    const confirmed = await confirm({
      title: "Hủy đơn hàng",
      message: "Bạn có chắc muốn hủy đơn hàng này?",
      confirmText: "Hủy đơn",
      cancelText: "Không",
      confirmColor: "red",
    });

    if (confirmed) {
      await handleUpdateStatus("cancelled");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {po.po_number}
                </h2>
                {editingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Nháp</option>
                      <option value="ordered">Đã đặt</option>
                      <option value="received">Đã nhận</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                    <button
                      onClick={() => handleUpdateStatus(newStatus)}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Lưu"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Hủy"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${statusConfig.bgColor} ${statusConfig.color} border border-current/10`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={() => {
                        setEditingStatus(true);
                        setNewStatus(po.status);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                      title="Sửa trạng thái"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Chi tiết đơn nhập hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
          {/* Info Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Supplier & Branch */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Nhà cung cấp
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {po.supplier?.name || "—"}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Chi nhánh nhập
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {po.branch_id}
                </div>
              </div>
            </div>

            {/* Column 2: Dates */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Ngày đặt hàng
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {po.order_date ? formatDate(po.order_date) : "—"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Dự kiến giao
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {po.expected_date ? formatDate(po.expected_date) : "—"}
                  </div>
                </div>
                {po.received_date && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Ngày nhận
                    </div>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {formatDate(po.received_date)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Creator & Notes */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Người tạo đơn
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {po.creator?.name || po.creator?.email || "—"}
                  </div>
                </div>
              </div>
              {(po.notes || po.cancellation_reason) && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  {po.cancellation_reason ? (
                    <div>
                      <div className="text-xs font-medium text-red-500 uppercase tracking-wider mb-1">
                        Lý do hủy
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400 italic">
                        "{po.cancellation_reason}"
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Ghi chú
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 italic">
                        "{po.notes}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items Table Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                Chi tiết sản phẩm ({items.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-left w-[40%]">Sản phẩm</th>
                    <th className="px-4 py-4 text-center">SL đặt</th>
                    <th className="px-4 py-4 text-center">SL nhận</th>
                    <th className="px-6 py-4 text-right">Đơn giá</th>
                    <th className="px-6 py-4 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {item.part?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {item.part?.barcode || item.part?.sku}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                        {item.quantity_ordered}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold ${item.quantity_received === item.quantity_ordered
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : item.quantity_received > 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                            }`}
                        >
                          {item.quantity_received}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.total_price || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-end gap-2 max-w-xs ml-auto">
                {/* Total Amount */}
                <div className="flex items-center justify-between w-full text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Tổng tiền hàng:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between w-full text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Giảm giá:</span>
                  {isEditingCosts ? (
                    <input
                      type="number"
                      value={editDiscount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDiscount(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                    />
                  ) : (
                    <span className={`font-medium ${discountAmount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {discountAmount > 0 ? "-" : ""}{formatCurrency(discountAmount)}
                    </span>
                  )}
                </div>

                {/* Shipping Fee */}
                <div className="flex items-center justify-between w-full text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Phí vận chuyển:</span>
                  {isEditingCosts ? (
                    <input
                      type="number"
                      value={editShipping}
                      onChange={(e) => setEditShipping(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                    />
                  ) : (
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(shippingFee)}
                    </span>
                  )}
                </div>

                <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-1"></div>

                {/* Final Amount & Actions */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Thành tiền:</span>
                    {!isEditingCosts && (
                      <button
                        onClick={() => setIsEditingCosts(true)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        title="Chỉnh sửa chi phí"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                      </button>
                    )}
                  </div>
                  {isEditingCosts ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUpdateCosts}
                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Lưu"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditingCosts(false)}
                        className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                        title="Hủy"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(finalAmount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div>
            {po.status === "draft" && (
              <button
                onClick={handleCancelPO}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Hủy đơn
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Đóng
            </button>
            {po.status === "draft" && (
              <button
                onClick={handleMarkAsOrdered}
                disabled={updatePOMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Xác nhận đặt hàng
              </button>
            )}
            {po.status === "ordered" && (
              <button
                onClick={handleConvertToReceipt}
                disabled={convertMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCheck className="w-5 h-5" />
                {convertMutation.isPending ? "Đang xử lý..." : "Nhập kho"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        confirmColor={confirmState.confirmColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
