import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { canDo } from "../../utils/permissions";
import {
  Boxes,
  Package,
  Search,
  FileText,
  Edit,
  Trash2,
  Plus,
  Repeat,
  UploadCloud,
  DownloadCloud,
  MoreHorizontal,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { safeAudit } from "../../lib/repository/auditLogsRepository";
import { supabase } from "../../supabaseClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  usePartsRepoPaged,
  useCreatePartRepo,
  useUpdatePartRepo,
  useDeletePartRepo,
} from "../../hooks/usePartsRepository";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  exportPartsToExcel,
  exportInventoryTemplate,
  importPartsFromExcel,
  importPartsFromExcelDetailed,
} from "../../utils/excel";
import { showToast } from "../../utils/toast";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmModal from "../common/ConfirmModal";
import CategoriesManager from "../categories/CategoriesManager";
import LookupManager from "../lookup/LookupManager";
import { useCategories, useCreateCategory } from "../../hooks/useCategories";
import { useSuppliers, useCreateSupplier } from "../../hooks/useSuppliers";
import type { Part, InventoryTransaction } from "../../types";
import { fetchPartBySku } from "../../lib/repository/partsRepository";
import {
  useCreateInventoryTxRepo,
  useInventoryTxRepo,
} from "../../hooks/useInventoryTransactionsRepository";
import FormattedNumberInput from "../common/FormattedNumberInput";
import { validatePriceAndQty } from "../../utils/validation";

// Add New Product Modal Component
const AddProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    description: string;
    category: string;
    quantity: number;
    importPrice: number;
    retailPrice: number;
    warranty: number;
    warrantyUnit: string;
  }) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [importPrice, setImportPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [warranty, setWarranty] = useState<number>(1);
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
    setCategory("");
    setQuantity(1);
    setImportPrice(0);
    setRetailPrice(0);
    setWarranty(1);
    setRetailOverridden(false);
    setWarrantyUnit("tháng");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Thêm sản phẩm mới
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Tên sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Mô tả sản phẩm"
              />
            </div>

            {/* Danh mục sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Danh mục sản phẩm
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                    aria-label="Thêm danh mục mới"
                  >
                    <span className="text-xl text-slate-600 dark:text-slate-300">
                      +
                    </span>
                  </button>
                </div>
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
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInlineCat(false);
                        setInlineCatName("");
                      }}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Hủy
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Thông tin nhập kho */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Thông tin nhập kho:
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Số lượng:
                  </label>
                  <FormattedNumberInput
                    value={quantity}
                    onValue={(v) => {
                      const result = validatePriceAndQty(importPrice, v);
                      if (result.warnings.length)
                        result.warnings.forEach((w) => showToast.warning(w));
                      setQuantity(Math.max(1, result.clean.quantity));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Giá nhập:
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Giá bán lẻ:
                  </label>
                  <FormattedNumberInput
                    value={retailPrice}
                    onValue={(v) => {
                      setRetailPrice(Math.max(0, Math.round(v)));
                      setRetailOverridden(true);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Bảo hành */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bảo hành
              </label>
              <div className="flex gap-2">
                <FormattedNumberInput
                  value={warranty}
                  onValue={(v) => setWarranty(Math.max(0, Math.floor(v)))}
                  className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right"
                />
                <select
                  value={warrantyUnit}
                  onChange={(e) => setWarrantyUnit(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="tháng">tháng</option>
                  <option value="năm">năm</option>
                  <option value="ngày">ngày</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium"
          >
            Lưu và Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

// Goods Receipt Modal Component (Ảnh 2)
const GoodsReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  parts: Part[];
  currentBranchId: string;
  onSave: (
    items: Array<{
      partId: string;
      partName: string;
      quantity: number;
      importPrice: number;
      sellingPrice: number;
    }>,
    supplier: string,
    totalAmount: number,
    note: string
  ) => void;
}> = ({ isOpen, onClose, parts, currentBranchId, onSave }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const createPartMutation = useCreatePartRepo();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [receiptItems, setReceiptItems] = useState<
    Array<{
      partId: string;
      partName: string;
      sku: string;
      quantity: number;
      importPrice: number;
      sellingPrice: number;
      wholesalePrice: number;
    }>
  >([]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | null>(
    null
  );
  const [paymentType, setPaymentType] = useState<
    "full" | "partial" | "note" | null
  >(null);
  const [partialAmount, setPartialAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"amount" | "percent">(
    "amount"
  );
  const [discountPercent, setDiscountPercent] = useState(0);

  const filteredParts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!searchTerm) return parts; // Show all parts when no search term
    return parts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [parts, searchTerm]);

  const addToReceipt = (part: Part) => {
    const existing = receiptItems.find((item) => item.partId === part.id);
    if (existing) {
      setReceiptItems((items) =>
        items.map((item) =>
          item.partId === part.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setReceiptItems([
        ...receiptItems,
        {
          partId: part.id,
          partName: part.name,
          sku: part.sku,
          quantity: 1,
          importPrice: part.costPrice?.[currentBranchId] || 0,
          sellingPrice: part.retailPrice[currentBranchId] || 0,
          wholesalePrice: part.wholesalePrice?.[currentBranchId] || 0,
        },
      ]);
    }
    setSearchTerm("");
  };

  const updateReceiptItem = (
    partId: string,
    field: "quantity" | "importPrice" | "sellingPrice" | "wholesalePrice",
    value: number
  ) => {
    setReceiptItems((items) =>
      items.map((item) =>
        item.partId === partId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeReceiptItem = (partId: string) => {
    setReceiptItems((items) => items.filter((item) => item.partId !== partId));
  };

  const subtotal = useMemo(() => {
    return receiptItems.reduce(
      (sum, item) => sum + item.importPrice * item.quantity,
      0
    );
  }, [receiptItems]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const { profile } = useAuth();
  const handleSave = () => {
    if (!canDo(profile?.role, "part.update_price")) {
      showToast.error("Bạn không có quyền cập nhật giá");
      return;
    }
    if (receiptItems.length === 0) {
      showToast.warning("Vui lòng chọn sản phẩm nhập kho");
      return;
    }
    const supplierName =
      suppliers.find((s: any) => s.id === selectedSupplier)?.name || "";
    onSave(receiptItems, supplierName, totalAmount, "");
    setReceiptItems([]);
    setSelectedSupplier("");
    setSearchTerm("");
    setDiscount(0);
    setDiscountPercent(0);
    setDiscountType("amount");
  };

  const handleAddNewProduct = (productData: any) => {
    // Persist part immediately so it shows in inventory list and can be referenced
    (async () => {
      try {
        const createRes = await createPartMutation.mutateAsync({
          name: productData.name,
          sku: `SKU-${Date.now()}`,
          category: productData.category,
          description: productData.description,
          stock: { [currentBranchId]: productData.quantity },
          retailPrice: { [currentBranchId]: productData.retailPrice },
          wholesalePrice: {
            [currentBranchId]: Math.round(productData.retailPrice * 0.9),
          },
        });
        // Add to receipt items from persisted part
        setReceiptItems((prev) => [
          ...prev,
          {
            partId: (createRes as any).id,
            partName: productData.name,
            sku: (createRes as any).sku,
            quantity: productData.quantity,
            importPrice: productData.importPrice,
            sellingPrice: productData.retailPrice,
            wholesalePrice: productData.wholesalePrice || 0,
          },
        ]);
        showToast.success("Đã tạo phụ tùng mới và thêm vào phiếu nhập");
      } catch (e: any) {
        showToast.error(e?.message || "Lỗi tạo phụ tùng mới");
      } finally {
        setShowAddProductModal(false);
      }
    })();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
          {/* Left Side - Product Selection */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
                >
                  ←
                </button>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Chọn sản phẩm nhập kho
                </h2>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <span className="text-xl">+</span>
                <span>Thêm sản phẩm mới</span>
              </button>
            </div>

            {/* Search */}
            <div className="p-6 bg-white dark:bg-slate-800">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredParts.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Không tìm thấy sản phẩm nào
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredParts.map((part) => (
                    <div
                      key={part.id}
                      onClick={() => addToReceipt(part)}
                      className="p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {part.name}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        SKU: {part.sku}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Receipt Details */}
          <div className="w-[500px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Supplier Selection */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nhà cung cấp (NCC):
                </label>
                <button
                  onClick={() => {
                    setNewSupplier({
                      name: "",
                      phone: "",
                      address: "",
                      note: "",
                    });
                    setShowSupplierModal(true);
                  }}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-slate-700 dark:text-blue-400"
                >
                  <span className="text-base leading-none">+</span>
                  Thêm NCC
                </button>
              </div>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">Tìm/Chọn nhà cung cấp</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ""}
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {(() => {
                    const s = suppliers.find(
                      (x: any) => x.id === selectedSupplier
                    );
                    if (!s) return null;
                    return (
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Tên:</span> {s.name}
                        </div>
                        {s.phone && (
                          <div>
                            <span className="font-medium">ĐT:</span> {s.phone}
                          </div>
                        )}
                        {s.address && (
                          <div>
                            <span className="font-medium">Đ/c:</span>{" "}
                            {s.address}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {showSupplierModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Thêm nhà cung cấp
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                        Tên *
                      </label>
                      <input
                        autoFocus
                        value={newSupplier.name}
                        onChange={(e) =>
                          setNewSupplier((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                        placeholder="Tên nhà cung cấp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                        Điện thoại
                      </label>
                      <input
                        value={newSupplier.phone}
                        onChange={(e) =>
                          setNewSupplier((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                        placeholder="SĐT"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                        Địa chỉ
                      </label>
                      <textarea
                        rows={2}
                        value={newSupplier.address}
                        onChange={(e) =>
                          setNewSupplier((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
                        placeholder="Địa chỉ nhà cung cấp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                        Ghi chú
                      </label>
                      <textarea
                        rows={2}
                        value={newSupplier.note}
                        onChange={(e) =>
                          setNewSupplier((p) => ({
                            ...p,
                            note: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
                        placeholder="Thông tin thêm (tùy chọn)"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowSupplierModal(false)}
                      className="px-4 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={async () => {
                        if (!newSupplier.name.trim()) {
                          showToast.warning("Nhập tên nhà cung cấp");
                          return;
                        }
                        try {
                          const res: any = await createSupplier.mutateAsync({
                            name: newSupplier.name.trim(),
                            phone: newSupplier.phone?.trim() || undefined,
                            address: newSupplier.address?.trim() || undefined,
                          });
                          setSelectedSupplier(res.id);
                          setShowSupplierModal(false);
                        } catch (e: any) {
                          // mutation hook đã show toast
                        }
                      }}
                      className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      disabled={createSupplier.isPending}
                    >
                      {createSupplier.isPending ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Giỏ hàng nhập kho
                </h3>
                <span className="text-sm text-slate-500">
                  ({receiptItems.length} sản phẩm)
                </span>
              </div>

              {receiptItems.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <div className="text-4xl mb-2">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300" />
                  </div>
                  <div className="text-sm">Giỏ hàng trống</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Chọn sản phẩm để thêm vào giỏ
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {receiptItems.map((item) => (
                    <div
                      key={item.partId}
                      className="border border-slate-200 dark:border-slate-600 rounded-lg p-3"
                    >
                      {/* Header: Product Info + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Boxes className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {item.partName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            SKU: {item.sku}
                          </div>
                        </div>
                        <button
                          onClick={() => removeReceiptItem(item.partId)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex-shrink-0"
                          title="Xóa"
                        >
                          ×
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Số lượng:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateReceiptItem(
                                item.partId,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-sm text-slate-900 dark:text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateReceiptItem(
                                item.partId,
                                "quantity",
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price Inputs */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Giá nhập:
                          </label>
                          <FormattedNumberInput
                            value={item.importPrice}
                            onValue={(val) => {
                              const { clean } = validatePriceAndQty(
                                val,
                                item.quantity
                              );
                              const newImport = clean.importPrice;
                              const autoPrice = Math.round(newImport * 1.5);
                              setReceiptItems((items) =>
                                items.map((it) =>
                                  it.partId === item.partId
                                    ? {
                                        ...it,
                                        importPrice: newImport,
                                        sellingPrice:
                                          it.sellingPrice === 0 ||
                                          it.sellingPrice ===
                                            Math.round(
                                              (it.importPrice || 0) * 1.5
                                            )
                                            ? autoPrice
                                            : it.sellingPrice,
                                      }
                                    : it
                                )
                              );
                            }}
                            className="w-40 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Giá bán lẻ:
                          </label>
                          <FormattedNumberInput
                            value={item.sellingPrice}
                            onValue={(val) =>
                              updateReceiptItem(
                                item.partId,
                                "sellingPrice",
                                Math.max(0, Math.round(val))
                              )
                            }
                            className="w-40 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Giá bán sỉ:
                          </label>
                          <FormattedNumberInput
                            value={item.wholesalePrice || 0}
                            onValue={(val) =>
                              updateReceiptItem(
                                item.partId,
                                "wholesalePrice",
                                Math.max(0, Math.round(val))
                              )
                            }
                            className="w-40 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Thành tiền:
                          </span>
                          <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.importPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
              {/* Total Amount */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  Tổng tiền hàng
                </span>
                <span className="text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Discount - Optional */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Giảm giá:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={
                        discountType === "amount"
                          ? discount || ""
                          : discountPercent
                      }
                      onChange={(e) => {
                        const value = Number(e.target.value) || 0;
                        if (discountType === "amount") {
                          if (value > subtotal) {
                            showToast.warning(
                              "Giảm giá không được lớn hơn tổng tiền!"
                            );
                            setDiscount(subtotal);
                          } else {
                            setDiscount(value);
                          }
                        } else {
                          const percent = Math.min(value, 100);
                          setDiscountPercent(percent);
                          setDiscount(Math.round((subtotal * percent) / 100));
                        }
                      }}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                      min="0"
                      max={discountType === "amount" ? subtotal : 100}
                    />
                    <select
                      value={discountType}
                      onChange={(e) => {
                        const newType = e.target.value as "amount" | "percent";
                        setDiscountType(newType);
                        setDiscount(0);
                        setDiscountPercent(0);
                      }}
                      className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                    >
                      <option value="amount">₫</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>

                {/* Quick percent buttons */}
                {discountType === "percent" && (
                  <div className="flex gap-1 justify-end">
                    {[5, 10, 15, 20].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => {
                          setDiscountPercent(percent);
                          setDiscount(Math.round((subtotal * percent) / 100));
                        }}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 rounded transition-colors"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                )}

                {/* Show amount if percent mode */}
                {discountType === "percent" && discountPercent > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    = {formatCurrency(discount)}
                  </div>
                )}
              </div>

              {/* Amount to Pay */}
              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-slate-100">
                  Khách phải trả
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Phương thức thanh toán <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "cash"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-6 h-6"
                    >
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="font-medium">Tiền mặt</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("bank")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "bank"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-6 h-6"
                    >
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
                      <path d="M2 10h20" />
                      <path d="M6 14h4" />
                    </svg>
                    <span className="font-medium">Chuyển khoản</span>
                  </button>
                </div>
              </div>

              {/* Payment Type - Only show after payment method is selected */}
              {paymentMethod && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Hình thức
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setPaymentType("full");
                        setPartialAmount(0);
                      }}
                      className={`px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition-all ${
                        paymentType === "full"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      Thanh toán đủ
                    </button>
                    <button
                      onClick={() => setPaymentType("partial")}
                      className={`px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition-all ${
                        paymentType === "partial"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      Thanh toán 1 phần
                    </button>
                    <button
                      onClick={() => {
                        setPaymentType("note");
                        setPartialAmount(0);
                      }}
                      className={`px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition-all ${
                        paymentType === "note"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      Ghi nợ
                    </button>
                  </div>
                </div>
              )}

              {/* Partial Payment Amount Input */}
              {paymentType === "partial" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Số tiền khách trả
                  </label>
                  <FormattedNumberInput
                    value={partialAmount}
                    onValue={(v) =>
                      setPartialAmount(Math.max(0, Math.round(v)))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-right text-lg font-medium"
                    placeholder="0"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Còn lại:{" "}
                    {formatCurrency(Math.max(0, totalAmount - partialAmount))} ₫
                  </div>
                </div>
              )}

              {/* Account Category */}
              {paymentMethod && paymentType && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hạch toán:
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <option>Mua hàng/nhập kho</option>
                    <option>Nhập trả hàng</option>
                    <option>Khác</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  LƯU NHÁP
                </button>
                <button
                  onClick={() => {
                    if (!paymentMethod) {
                      showToast.warning("Vui lòng chọn phương thức thanh toán");
                      return;
                    }
                    if (!paymentType) {
                      showToast.warning("Vui lòng chọn hình thức thanh toán");
                      return;
                    }
                    if (paymentType === "partial" && partialAmount <= 0) {
                      showToast.warning("Vui lòng nhập số tiền khách trả");
                      return;
                    }
                    handleSave();
                  }}
                  disabled={
                    !paymentMethod ||
                    !paymentType ||
                    (paymentType === "partial" && partialAmount <= 0)
                  }
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                >
                  NHẬP KHO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSave={handleAddNewProduct}
      />
    </>
  );
};

// Add/Edit Supplier Modal Component
const SupplierModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: {
    name: string;
    phone: string;
    address: string;
    email: string;
  }) => void;
  initialData?: { name: string; phone: string; address: string; email: string };
  mode: "add" | "edit";
}> = ({ isOpen, onClose, onSave, initialData, mode }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [email, setEmail] = useState(initialData?.email || "");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setAddress(initialData.address);
      setEmail(initialData.email);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      email: email.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mode === "add"
                ? "Thêm nhà cung cấp mới"
                : "Chỉnh sửa nhà cung cấp"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên nhà cung cấp *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên nhà cung cấp"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {mode === "add" ? "Thêm" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Product to Receipt Modal Component
const AddProductToReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    partId: string;
    partName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }) => void;
  currentBranchId: string;
}> = ({ isOpen, onClose, onAdd, currentBranchId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: allParts = [] } = useQuery<Part[]>({
    queryKey: ["allPartsForReceipt"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredParts = useMemo(() => {
    if (!searchTerm) return [];
    const q = searchTerm.toLowerCase();
    return allParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [allParts, searchTerm]);

  const handleSelectProduct = (part: Part) => {
    setSelectedProduct(part);
    setUnitPrice(part.costPrice?.[currentBranchId] || 0);
    setSearchTerm(part.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast.error("Vui lòng chọn sản phẩm");
      return;
    }
    if (quantity <= 0) {
      showToast.error("Số lượng phải lớn hơn 0");
      return;
    }
    if (unitPrice < 0) {
      showToast.error("Đơn giá không được âm");
      return;
    }

    onAdd({
      partId: selectedProduct.id,
      partName: selectedProduct.name,
      sku: selectedProduct.sku || "",
      quantity,
      unitPrice,
    });

    // Reset form
    setSearchTerm("");
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Thêm sản phẩm vào phiếu
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Product Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tìm kiếm sản phẩm *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProduct(null);
                  }}
                  placeholder="Nhập tên hoặc SKU sản phẩm..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  autoFocus
                />
                {searchTerm && !selectedProduct && filteredParts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredParts.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => handleSelectProduct(part)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {part.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          SKU: {part.sku || "N/A"} | Giá nhập:{" "}
                          {formatCurrency(
                            part.costPrice?.[currentBranchId] || 0
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
                  ✓ Đã chọn: {selectedProduct.name} ({selectedProduct.sku})
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Số lượng *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Đơn giá nhập *
              </label>
              <FormattedNumberInput
                value={unitPrice}
                onValue={setUnitPrice}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="0"
              />
            </div>

            {/* Total */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Thành tiền
              </label>
              <input
                type="text"
                value={formatCurrency(quantity * unitPrice)}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Thêm sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Receipt Modal Component - Full Receipt Editing
const EditReceiptModal: React.FC<{
  receipt: {
    receiptCode: string;
    date: Date;
    supplier: string;
    items: InventoryTransaction[];
    total: number;
  };
  onClose: () => void;
  onSave: (data: any) => void;
  currentBranchId: string;
}> = ({ receipt, onClose, onSave, currentBranchId }) => {
  const [supplier, setSupplier] = useState(receipt.supplier);
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState(
    receipt.supplier
  );
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<"add" | "edit">(
    "add"
  );
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Fetch suppliers from database
  const { data: allSuppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return allSuppliers;
    const q = supplierSearchTerm.toLowerCase();
    return allSuppliers.filter((s: any) => s.name.toLowerCase().includes(q));
  }, [allSuppliers, supplierSearchTerm]);

  const [items, setItems] = useState(
    receipt.items.map((item) => ({
      id: item.id,
      partName: item.partName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.quantity * (item.unitPrice || 0),
      notes: item.notes || "",
    }))
  );
  const [payments, setPayments] = useState([
    {
      time: "15:31",
      date: receipt.date,
      payer: "Xuân Nhan",
      cashier: "(Tiền mặt)",
      amount: receipt.total,
    },
  ]);
  const [isPaid, setIsPaid] = useState(true);

  // Extract phone from notes if available
  React.useEffect(() => {
    const firstItem = receipt.items[0];
    if (firstItem?.notes?.includes("Phone:")) {
      const phone = firstItem.notes.split("Phone:")[1]?.split("NV:")[0]?.trim();
      if (phone) setSupplierPhone(phone);
    }
  }, [receipt.items]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".supplier-dropdown-container")) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].totalPrice = quantity * newItems[index].unitPrice;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, unitPrice: number) => {
    const newItems = [...items];
    newItems[index].unitPrice = unitPrice;
    newItems[index].totalPrice = newItems[index].quantity * unitPrice;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      showToast.error("Phải có ít nhất 1 sản phẩm");
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    showToast.success("Đã xóa sản phẩm");
  };

  const handleAddProduct = (product: {
    partId: string;
    partName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }) => {
    const newItem = {
      id: `new-${Date.now()}`, // Temporary ID for new items
      partId: product.partId,
      partName: product.partName,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      totalPrice: product.quantity * product.unitPrice,
      notes: "",
      sku: product.sku,
    };
    setItems([...items, newItem]);
    setShowAddProductModal(false);
    showToast.success(`Đã thêm ${product.partName} (sẽ lưu khi bấm LƯU)`);
  };

  const handleSaveSupplier = (supplierData: {
    name: string;
    phone: string;
    address: string;
    email: string;
  }) => {
    setSupplier(supplierData.name);
    setSupplierPhone(supplierData.phone);
    setShowSupplierModal(false);
    showToast.success(
      supplierModalMode === "add"
        ? "Đã thêm nhà cung cấp"
        : "Đã cập nhật nhà cung cấp"
    );
  };

  const handleEditSupplier = () => {
    setSupplierModalMode("edit");
    setShowSupplierModal(true);
  };

  const handleAddSupplier = () => {
    setSupplierModalMode("add");
    setShowSupplierModal(true);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    showToast.info("Click vào ô số lượng hoặc đơn giá để chỉnh sửa");
  };

  const handleItemMenu = (index: number) => {
    if (confirm("Bạn có muốn xóa sản phẩm này?")) {
      removeItem(index);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) {
      showToast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (items.some((item) => item.quantity <= 0)) {
      showToast.error("Số lượng phải lớn hơn 0");
      return;
    }
    onSave({ supplier, supplierPhone, items, payments, isPaid });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  [Chỉnh sửa] Phiếu Nhập Kho {receipt.receiptCode}
                </h3>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {new Date(receipt.date).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {new Date(receipt.date).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Supplier Section */}
            <div>
              <label className="block text-base font-medium text-teal-600 dark:text-teal-400 mb-2">
                Nhà cung cấp:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative supplier-dropdown-container">
                  <input
                    type="text"
                    value={supplierSearchTerm}
                    onChange={(e) => {
                      setSupplierSearchTerm(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    placeholder="Tìm kiếm và chọn một nhà cung cấp"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  {supplierSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierSearchTerm("");
                        setSupplier("");
                        setSupplierPhone("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  )}
                  {/* Supplier Dropdown */}
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuppliers.map((sup: any) => (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => {
                            setSupplier(sup.name);
                            setSupplierSearchTerm(sup.name);
                            setSupplierPhone(sup.phone || "");
                            setShowSupplierDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0"
                        >
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {sup.name}
                          </div>
                          {sup.phone && (
                            <div className="text-xs text-slate-500">
                              Phone: {sup.phone}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEditSupplier}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Thêm mới
                </button>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-base font-medium text-teal-600 dark:text-teal-400">
                  Chi tiết sản phẩm nhập kho:
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
                >
                  <span className="text-lg">+</span>
                  Thêm sản phẩm
                </button>
              </div>

              {/* Products Table */}
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        -
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tên
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        SL
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                        Đơn giá nhập
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                        Thành tiền
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          editingItemIndex === index
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3 text-sm text-slate-900 dark:text-slate-100">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            {item.partName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            [Khác]
                          </div>
                          <div className="text-xs text-slate-500">
                            - ĐG Bán lẻ: {formatCurrency(70000)}
                          </div>
                          <div className="text-xs text-slate-500">
                            - ĐG Bán sỉ: {formatCurrency(0)}
                          </div>
                          <div className="text-xs text-red-500">
                            (Đã xuất kho)
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(index, Number(e.target.value))
                            }
                            onFocus={() => setEditingItemIndex(index)}
                            onBlur={() => setEditingItemIndex(null)}
                            min="1"
                            className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <FormattedNumberInput
                            value={item.unitPrice}
                            onValue={(val) => updateItemPrice(index, val)}
                            className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditItem(index)}
                              className="p-1 text-blue-400 hover:bg-blue-500/20 rounded"
                              title="Chỉnh sửa"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleItemMenu(index)}
                              className="p-1 text-slate-400 hover:bg-slate-500/20 rounded"
                              title="Xóa sản phẩm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100"
                      >
                        TỔNG:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Section */}
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4">
              <label className="block text-base font-medium text-teal-600 dark:text-teal-400 mb-3">
                Công nợ:
              </label>

              {/* Total Payment */}
              <div className="flex items-center justify-between mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  TỔNG PHẢI CHI: {formatCurrency(totalAmount)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Đã thanh toán đủ
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1"
                  >
                    <span className="text-lg">+</span>
                    Tạo phiếu chi
                  </button>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-start gap-1">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tổng phải chi là phí chưa phải trả cho đối tác sửa chữa
              </div>

              {/* Payment History Table */}
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2 py-2 text-left text-slate-700 dark:text-slate-300">
                      -
                    </th>
                    <th className="px-2 py-2 text-left text-slate-700 dark:text-slate-300">
                      Thời gian
                    </th>
                    <th className="px-2 py-2 text-left text-slate-700 dark:text-slate-300">
                      Người chi - Ghi chú
                    </th>
                    <th className="px-2 py-2 text-right text-slate-700 dark:text-slate-300">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 dark:border-slate-700"
                    >
                      <td className="px-2 py-2 text-slate-900 dark:text-slate-100">
                        {index + 1}
                      </td>
                      <td className="px-2 py-2 text-slate-900 dark:text-slate-100">
                        {payment.time}{" "}
                        {new Date(payment.date).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-slate-900 dark:text-slate-100">
                          {payment.payer}
                        </div>
                        <div className="text-xs text-slate-500">
                          {payment.cashier}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right text-slate-900 dark:text-slate-100">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-2 text-right font-bold text-slate-900 dark:text-slate-100"
                    >
                      Tổng đã chi
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ĐÓNG
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              LƯU
            </button>
          </div>
        </form>

        {/* Supplier Modal */}
        <SupplierModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSave={handleSaveSupplier}
          initialData={
            supplierModalMode === "edit"
              ? { name: supplier, phone: supplierPhone, address: "", email: "" }
              : undefined
          }
          mode={supplierModalMode}
        />

        {/* Add Product Modal */}
        <AddProductToReceiptModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onAdd={handleAddProduct}
          currentBranchId={currentBranchId}
        />
      </div>
    </div>
  );
};

// Inventory History Section Component (Embedded in main page)
const InventoryHistorySection: React.FC<{
  transactions: InventoryTransaction[];
}> = ({ transactions }) => {
  const queryClient = useQueryClient();
  const [activeTimeFilter, setActiveTimeFilter] = useState("7days");
  const [customStartDate, setCustomStartDate] = useState(
    formatDate(new Date(), true)
  );
  const [customEndDate, setCustomEndDate] = useState(
    formatDate(new Date(), true)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [editingReceipt, setEditingReceipt] = useState<{
    receiptCode: string;
    date: Date;
    supplier: string;
    items: InventoryTransaction[];
    total: number;
  } | null>(null);
  const { currentBranchId } = useAppContext();

  const filteredTransactions = useMemo(() => {
    // CHỈ LẤY GIAO DỊCH NHẬP KHO
    console.log(
      "📦 [InventoryHistorySection] Tổng số giao dịch:",
      transactions.length
    );
    let filtered = transactions.filter((t) => t.type === "Nhập kho");
    console.log(
      "📦 [InventoryHistorySection] Giao dịch 'Nhập kho':",
      filtered.length
    );
    const now = new Date();

    // Apply time filter
    switch (activeTimeFilter) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t) => new Date(t.date) >= sevenDaysAgo);
        break;
      case "30days":
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        filtered = filtered.filter((t) => new Date(t.date) >= thirtyDaysAgo);
        break;
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter((t) => new Date(t.date) >= startOfMonth);
        break;
      case "custom":
        filtered = filtered.filter((t) => {
          const date = new Date(t.date);
          return (
            date >= new Date(customStartDate) && date <= new Date(customEndDate)
          );
        });
        break;
    }

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.partName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    transactions,
    activeTimeFilter,
    customStartDate,
    customEndDate,
    searchTerm,
  ]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
  }, [filteredTransactions]);

  // Group transactions by receipt (same date, same supplier/notes)
  const groupedReceipts = useMemo(() => {
    const groups = new Map<string, InventoryTransaction[]>();

    filteredTransactions.forEach((transaction) => {
      // Create a group key based on date and supplier
      const date = new Date(transaction.date);
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const supplier = transaction.notes?.includes("NCC:")
        ? transaction.notes.split("NCC:")[1]?.trim()
        : "Không xác định";
      const groupKey = `${dateKey}_${supplier}_${date.getHours()}_${date.getMinutes()}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(transaction);
    });

    // Convert to array and generate receipt codes
    return Array.from(groups.entries())
      .map(([key, items], index) => {
        const firstItem = items[0];
        const date = new Date(firstItem.date);
        const dateStr = `${date.getFullYear()}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
        const receiptCode = `PN-${dateStr}-${String(
          groups.size - index
        ).padStart(3, "0")}`;

        return {
          receiptCode,
          date: firstItem.date,
          supplier: firstItem.notes?.includes("NCC:")
            ? firstItem.notes.split("NCC:")[1]?.trim()
            : "Không xác định",
          items,
          total: items.reduce((sum, item) => sum + item.totalPrice, 0),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(
    new Set()
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Lịch sử nhập kho
        </h2>

        {/* Time Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "7days", label: "7 ngày qua" },
            { key: "30days", label: "30 ngày qua" },
            { key: "thisMonth", label: "Tháng này" },
            { key: "custom", label: "Tùy chọn" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveTimeFilter(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTimeFilter === filter.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {activeTimeFilter === "custom" && (
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Nhà cung cấp, SKU, tên phụ tùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Tổng số tiền:{" "}
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {groupedReceipts.length}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Tổng giá trị
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {groupedReceipts.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <div className="text-6xl mb-4">📦</div>
            <div>Không có dữ liệu</div>
          </div>
        ) : (
          groupedReceipts.map((receipt) => (
            <div
              key={receipt.receiptCode}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              {/* Receipt Row - Horizontal Layout */}
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedReceipts.has(receipt.receiptCode)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedReceipts);
                    if (e.target.checked) {
                      newSelected.add(receipt.receiptCode);
                    } else {
                      newSelected.delete(receipt.receiptCode);
                    }
                    setSelectedReceipts(newSelected);
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 flex-shrink-0"
                />

                {/* Date Column */}
                <div className="w-28 flex-shrink-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(receipt.date).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(receipt.date).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Supplier Column */}
                <div className="w-40 flex-shrink-0">
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {receipt.supplier}
                  </div>
                  {receipt.items[0].notes?.includes("Phone:") && (
                    <div className="text-xs text-slate-500">
                      Phone: {receipt.items[0].notes.split("Phone:")[1]?.trim()}
                    </div>
                  )}
                </div>

                {/* Items Details Column - Flex grow */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Chi tiết nhập kho:
                  </div>
                  <div className="space-y-0.5">
                    {receipt.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="text-sm text-slate-900 dark:text-slate-100"
                      >
                        <span className="text-slate-600 dark:text-slate-400">
                          {item.quantity}x{" "}
                        </span>
                        <span>{item.partName}</span>
                        <span className="text-slate-500">
                          {" "}
                          (ĐG: {formatCurrency(item.unitPrice || 0)})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    NV: Nhập kho:{" "}
                    {receipt.items[0].notes
                      ?.split("NV:")[1]
                      ?.split("NCC:")[0]
                      ?.trim() || "Xuân Nhan"}
                  </div>
                </div>

                {/* Amount Column */}
                <div className="w-32 text-right flex-shrink-0">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(receipt.total)}
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() =>
                      setEditingReceipt({
                        ...receipt,
                        date: new Date(receipt.date),
                      })
                    }
                    className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                    title="Chỉnh sửa"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    className="p-1.5 text-slate-400 hover:bg-slate-500/20 rounded transition-colors"
                    title="Thêm tùy chọn"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - if needed */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Hiển thị {groupedReceipts.length} phiếu nhập
        </div>
      </div>

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          onClose={() => setEditingReceipt(null)}
          onSave={async (updatedData) => {
            try {
              // Track original item IDs to detect deletions
              const originalItemIds = new Set(
                editingReceipt.items.map((i) => i.id)
              );
              const updatedItemIds = new Set(
                updatedData.items
                  .filter((i: any) => !i.id.startsWith("new-"))
                  .map((i: any) => i.id)
              );

              // 1. Handle DELETED items - rollback stock
              const deletedItemIds = Array.from(originalItemIds).filter(
                (id) => !updatedItemIds.has(id)
              );

              for (const deletedId of deletedItemIds) {
                const deletedItem = editingReceipt.items.find(
                  (i) => i.id === deletedId
                );
                if (!deletedItem) continue;

                // Get part info
                const { data: part, error: fetchError } = await supabase
                  .from("parts")
                  .select("stock")
                  .eq("id", deletedItem.partId)
                  .single();

                if (fetchError) {
                  throw new Error(
                    `Không thể lấy thông tin phụ tùng: ${fetchError.message}`
                  );
                }

                if (part) {
                  const currentStock = part.stock?.[currentBranchId] || 0;
                  const newStock = currentStock - deletedItem.quantity;

                  if (newStock < 0) {
                    throw new Error(
                      `Không thể xóa sản phẩm "${deletedItem.partName}" vì sẽ làm tồn kho âm`
                    );
                  }

                  // Update stock
                  const { error: updateError } = await supabase
                    .from("parts")
                    .update({
                      stock: {
                        ...part.stock,
                        [currentBranchId]: newStock,
                      },
                    })
                    .eq("id", deletedItem.partId);

                  if (updateError) {
                    throw new Error(
                      `Không thể cập nhật tồn kho: ${updateError.message}`
                    );
                  }
                }

                // Delete transaction
                const { error: deleteError } = await supabase
                  .from("inventory_transactions")
                  .delete()
                  .eq("id", deletedId);

                if (deleteError) {
                  throw new Error(
                    `Không thể xóa giao dịch: ${deleteError.message}`
                  );
                }
              }

              // 2. Handle UPDATED items - update transaction and adjust stock
              for (const item of updatedData.items) {
                if (item.id.startsWith("new-")) continue; // Skip new items for now

                const originalItem = editingReceipt.items.find(
                  (i) => i.id === item.id
                );

                // Update the transaction record
                const { error } = await supabase
                  .from("inventory_transactions")
                  .update({
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    notes: `NV:${
                      updatedData.items[0].notes
                        ?.split("NV:")[1]
                        ?.split("NCC:")[0]
                        ?.trim() || "Xuân Nhan"
                    } NCC:${updatedData.supplier}${
                      updatedData.supplierPhone
                        ? ` Phone:${updatedData.supplierPhone}`
                        : ""
                    }`,
                  })
                  .eq("id", item.id);

                if (error) throw error;

                // If quantity changed, update parts.stock
                if (originalItem && originalItem.quantity !== item.quantity) {
                  const quantityDiff = item.quantity - originalItem.quantity;

                  // Get the part to update its stock
                  const { data: part, error: fetchError } = await supabase
                    .from("parts")
                    .select("stock, id")
                    .eq("id", originalItem.partId)
                    .single();

                  if (fetchError) {
                    throw new Error(
                      `Không thể lấy thông tin phụ tùng: ${fetchError.message}`
                    );
                  }

                  if (part) {
                    const currentStock = part.stock?.[currentBranchId] || 0;
                    const newStock = currentStock + quantityDiff;

                    if (newStock < 0) {
                      throw new Error(
                        `Không thể giảm số lượng vì sẽ làm tồn kho âm (hiện có: ${currentStock})`
                      );
                    }

                    // Update stock in database
                    const { error: updateError } = await supabase
                      .from("parts")
                      .update({
                        stock: {
                          ...part.stock,
                          [currentBranchId]: newStock,
                        },
                      })
                      .eq("id", part.id);

                    if (updateError) {
                      throw new Error(
                        `Không thể cập nhật tồn kho: ${updateError.message}`
                      );
                    }
                  }
                }
              }

              // 3. Handle NEW items - create transaction and add stock
              const newItems = updatedData.items.filter((i: any) =>
                i.id.startsWith("new-")
              );

              for (const newItem of newItems) {
                // Get part info
                const { data: part, error: fetchError } = await supabase
                  .from("parts")
                  .select("stock, id")
                  .eq("id", newItem.partId)
                  .single();

                if (fetchError) {
                  throw new Error(
                    `Không thể lấy thông tin phụ tùng: ${fetchError.message}`
                  );
                }

                if (part) {
                  const currentStock = part.stock?.[currentBranchId] || 0;
                  const newStock = currentStock + newItem.quantity;

                  // Update stock
                  const { error: updateError } = await supabase
                    .from("parts")
                    .update({
                      stock: {
                        ...part.stock,
                        [currentBranchId]: newStock,
                      },
                    })
                    .eq("id", part.id);

                  if (updateError) {
                    throw new Error(
                      `Không thể cập nhật tồn kho: ${updateError.message}`
                    );
                  }
                }

                // Create new transaction
                const { error: insertError } = await supabase
                  .from("inventory_transactions")
                  .insert({
                    type: "Nhập kho",
                    partId: newItem.partId,
                    partName: newItem.partName,
                    quantity: newItem.quantity,
                    date: editingReceipt.date.toISOString(),
                    unitPrice: newItem.unitPrice,
                    totalPrice: newItem.totalPrice,
                    branchId: currentBranchId,
                    notes: `NV:${
                      updatedData.items[0].notes
                        ?.split("NV:")[1]
                        ?.split("NCC:")[0]
                        ?.trim() || "Xuân Nhan"
                    } NCC:${updatedData.supplier}${
                      updatedData.supplierPhone
                        ? ` Phone:${updatedData.supplierPhone}`
                        : ""
                    }`,
                  });

                if (insertError) {
                  throw new Error(
                    `Không thể tạo giao dịch mới: ${insertError.message}`
                  );
                }
              }

              showToast.success(
                `Đã cập nhật phiếu nhập kho (${updatedData.items.length} sản phẩm)`
              );
              queryClient.invalidateQueries({
                queryKey: ["inventoryTransactions"],
              });
              queryClient.invalidateQueries({
                queryKey: ["partsRepo"],
              });
              queryClient.invalidateQueries({
                queryKey: ["partsRepoPaged"],
              });
              setEditingReceipt(null);
            } catch (err: any) {
              showToast.error(`Lỗi cập nhật: ${err.message || "Không rõ"}`);
            }
          }}
          currentBranchId={currentBranchId}
        />
      )}
    </div>
  );
};

// Inventory History Modal Component (Ảnh 3)
const InventoryHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transactions: InventoryTransaction[];
}> = ({ isOpen, onClose, transactions }) => {
  const queryClient = useQueryClient();
  const [activeTimeFilter, setActiveTimeFilter] = useState("7days");
  const [customStartDate, setCustomStartDate] = useState(
    formatDate(new Date(), true)
  );
  const [customEndDate, setCustomEndDate] = useState(
    formatDate(new Date(), true)
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = useMemo(() => {
    // CHỈ LẤY GIAO DỊCH NHẬP KHO
    let filtered = transactions.filter((t) => t.type === "Nhập kho");
    const now = new Date();

    // Apply time filter
    switch (activeTimeFilter) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t) => new Date(t.date) >= sevenDaysAgo);
        break;
      case "30days":
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        filtered = filtered.filter((t) => new Date(t.date) >= thirtyDaysAgo);
        break;
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter((t) => new Date(t.date) >= startOfMonth);
        break;
      case "custom":
        filtered = filtered.filter((t) => {
          const date = new Date(t.date);
          return (
            date >= new Date(customStartDate) && date <= new Date(customEndDate)
          );
        });
        break;
    }

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.partName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    transactions,
    activeTimeFilter,
    customStartDate,
    customEndDate,
    searchTerm,
  ]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
  }, [filteredTransactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Lịch sử nhập kho
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          {/* Time Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "7days", label: "7 ngày qua" },
              { key: "30days", label: "30 ngày qua" },
              { key: "thisMonth", label: "Tháng này" },
              { key: "custom", label: "Tùy chọn" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveTimeFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTimeFilter === filter.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {activeTimeFilter === "custom" && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nhà cung cấp, SKU, tên phụ tùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Tổng số tiền:{" "}
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {filteredTransactions.length}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Tổng giá trị
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {formatDate(new Date(transaction.date), false)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(transaction.date).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {transaction.notes && transaction.notes.includes("NCC:")
                          ? transaction.notes.split("NCC:")[1]?.trim() ||
                            "Chưa rõ"
                          : "Chưa rõ"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {transaction.partName}
                      </div>
                      <div className="text-xs text-slate-500">
                        SL: {transaction.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(transaction.totalPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement edit functionality
                            showToast.info("Tính năng đang phát triển");
                          }}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Bạn có chắc muốn xóa giao dịch nhập "${transaction.partName}"?`
                            );
                            if (confirmed) {
                              try {
                                const { error } = await supabase
                                  .from("inventory_transactions")
                                  .delete()
                                  .eq("id", transaction.id);

                                if (error) throw error;

                                showToast.success("Đã xóa giao dịch");
                                queryClient.invalidateQueries({
                                  queryKey: ["inventoryTransactions"],
                                });
                              } catch (err: any) {
                                showToast.error(
                                  `Lỗi xóa: ${err.message || "Không rõ"}`
                                );
                              }
                            }
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="Xóa"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Hiển thị {filteredTransactions.length} kết quả
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Inventory Manager Component (Ảnh 1)
const InventoryManager: React.FC = () => {
  const { currentBranchId } = useAppContext();
  // Supabase repository mutation for inventory transactions
  const { mutateAsync: createInventoryTxAsync } = useCreateInventoryTxRepo();
  const { data: invTx = [] } = useInventoryTxRepo({
    branchId: currentBranchId,
  });
  const [activeTab, setActiveTab] = useState("stock"); // stock, categories, lookup, history
  const [showGoodsReceipt, setShowGoodsReceipt] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [mobileMenuOpenIndex, setMobileMenuOpenIndex] = useState<number | null>(
    null
  );

  // Generate a color from category string for placeholder avatar
  const getCategoryColor = (name: string) => {
    if (!name) return "#94a3b8"; // slate-400
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return `#${"00000".substring(0, 6 - c.length) + c}`;
  };

  // Confirm dialog hook
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const {
    data: pagedResult,
    isLoading: partsLoading,
    isError: partsError,
  } = usePartsRepoPaged({
    page,
    pageSize,
    search,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });
  const repoParts = pagedResult?.data || [];
  const totalParts = pagedResult?.meta?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalParts / pageSize));

  // Fetch ALL parts for accurate totals calculation (stock, costPrice, retailPrice)
  const { data: allPartsData, refetch: refetchAllParts } = useQuery({
    queryKey: ["allPartsForTotals", currentBranchId, search, categoryFilter],
    queryFn: async () => {
      console.log("🔄 Fetching allPartsForTotals...");
      let query = supabase
        .from("parts")
        .select("id, name, sku, stock, costPrice, retailPrice")
        .order("name");

      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      console.log(`✅ Fetched ${data?.length || 0} parts`);
      return data || [];
    },
    staleTime: 5_000, // Reduced from 30s to 5s for faster updates
  });

  // Detect duplicate product names
  const duplicateNames = useMemo(() => {
    if (!allPartsData) return new Set<string>();
    const nameCount = new Map<string, number>();
    allPartsData.forEach((part: any) => {
      const count = nameCount.get(part.name) || 0;
      nameCount.set(part.name, count + 1);
    });
    const duplicates = new Set(
      Array.from(nameCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([name, _]) => name)
    );
    console.log(
      `🔍 Detected ${duplicates.size} duplicate product names from ${allPartsData.length} parts`
    );
    if (duplicates.size > 0) {
      console.log("Duplicate names:", Array.from(duplicates).slice(0, 5));
    }
    return duplicates;
  }, [allPartsData]);

  // Check if a part has duplicate name
  const hasDuplicateName = useCallback(
    (partName: string) => {
      return duplicateNames.has(partName);
    },
    [duplicateNames]
  );

  // Fetch duplicate parts when filter is enabled
  const { data: duplicatePartsData } = useQuery({
    queryKey: ["duplicateParts", currentBranchId, Array.from(duplicateNames)],
    queryFn: async () => {
      if (duplicateNames.size === 0) return [];

      console.log(
        `🔍 Fetching all duplicate parts for ${duplicateNames.size} names...`
      );

      // Fetch all parts with duplicate names
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .in("name", Array.from(duplicateNames))
        .order("name");

      if (error) throw error;
      console.log(`✅ Found ${data?.length || 0} parts with duplicate names`);
      return data || [];
    },
    enabled: showDuplicatesOnly && duplicateNames.size > 0,
    staleTime: 5_000,
  });

  // Sau khi chuyển sang server filter, filteredParts = repoParts (có thể thêm client filter tồn kho nếu cần)
  const filteredParts = useMemo(() => {
    // If showing duplicates only, use the duplicate parts data
    if (showDuplicatesOnly && duplicateNames.size > 0) {
      return duplicatePartsData || [];
    }

    // Otherwise use the paginated results
    return repoParts;
  }, [repoParts, showDuplicatesOnly, duplicateNames, duplicatePartsData]);

  // Auto-disable duplicate filter when no duplicates remain
  useEffect(() => {
    if (showDuplicatesOnly && duplicateNames.size === 0) {
      setShowDuplicatesOnly(false);
    }
  }, [showDuplicatesOnly, duplicateNames.size]);

  const totalStockQuantity = useMemo(() => {
    if (!allPartsData) return 0;
    return allPartsData.reduce((sum, part: any) => {
      return sum + (part.stock?.[currentBranchId] || 0);
    }, 0);
  }, [allPartsData, currentBranchId]);

  const totalStockValue = useMemo(() => {
    if (!allPartsData) return 0;
    return allPartsData.reduce((sum, part: any) => {
      const stock = part.stock?.[currentBranchId] || 0;
      const costPrice = part.costPrice?.[currentBranchId] || 0;
      return sum + stock * costPrice;
    }, 0);
  }, [allPartsData, currentBranchId]);

  const queryClient = useQueryClient();
  const updatePartMutation = useUpdatePartRepo();
  const createPartMutation = useCreatePartRepo();
  const deletePartMutation = useDeletePartRepo();
  const { data: allCategories = [] } = useCategories();

  const { profile } = useAuth();
  const handleSaveGoodsReceipt = useCallback(
    (
      items: Array<{
        partId: string;
        partName: string;
        quantity: number;
        importPrice: number;
        sellingPrice: number;
        wholesalePrice?: number;
      }>,
      supplier: string,
      totalAmount: number,
      note: string
    ) => {
      // ⚠️ IMPORTANT: Stock is now auto-updated by trigger (trg_inventory_tx_after_insert)
      // We only need to:
      // 1. Create inventory_transaction (trigger will update stock)
      // 2. Update prices (retailPrice, wholesalePrice) - not handled by trigger

      items.forEach(async (item) => {
        const part = repoParts.find((p) => p.id === item.partId);

        // Create inventory transaction - trigger will auto-update stock
        try {
          await createInventoryTxAsync({
            type: "Nhập kho",
            partId: item.partId,
            partName: item.partName,
            quantity: item.quantity,
            date: new Date().toISOString(),
            unitPrice: item.importPrice,
            totalPrice: item.importPrice * item.quantity,
            branchId: currentBranchId,
            notes: supplier ? `NCC: ${supplier}` : note,
          });
        } catch (err: any) {
          console.error("Lỗi lưu lịch sử kho:", err);
          showToast.error(`Lỗi lưu lịch sử: ${err.message || "Không rõ"}`);
          return; // Skip price update if transaction failed
        }

        // Update only prices (not stock - trigger handles stock)
        if (part) {
          updatePartMutation.mutate({
            id: item.partId,
            updates: {
              retailPrice: {
                ...part.retailPrice,
                [currentBranchId]: item.sellingPrice,
              },
              wholesalePrice: {
                ...part.wholesalePrice,
                [currentBranchId]: item.wholesalePrice || 0,
              },
            },
          });

          // Audit price update if price changed
          if (part.retailPrice[currentBranchId] !== item.sellingPrice) {
            void safeAudit(profile?.id || null, {
              action: "part.update_price",
              tableName: "parts",
              recordId: part.id,
              oldData: { retailPrice: part.retailPrice[currentBranchId] },
              newData: { retailPrice: item.sellingPrice },
            });
          }
        }
      });

      setShowGoodsReceipt(false);
      showToast.success("Nhập kho thành công!");
      // High-level audit of goods receipt batch
      void safeAudit(profile?.id || null, {
        action: "inventory.receipt",
        tableName: "inventory_transactions",
        oldData: null,
        newData: {
          supplier,
          items: items.map((i) => ({
            partId: i.partId,
            quantity: i.quantity,
            importPrice: i.importPrice,
            sellingPrice: i.sellingPrice,
          })),
          totalAmount,
        },
      });
    },
    [
      repoParts,
      currentBranchId,
      updatePartMutation,
      createInventoryTxAsync,
      profile?.id,
    ]
  );

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredParts.map((p) => p.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle select item
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    }
  };

  // Handle delete single item
  const handleDeleteItem = async (id: string) => {
    const part = repoParts.find((p) => p.id === id);
    if (!part) return;

    const confirmed = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa sản phẩm "${part.name}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      confirmColor: "red",
    });

    if (!confirmed) return;

    deletePartMutation.mutate(
      { id },
      {
        onSuccess: async () => {
          // Remove from selected items if it was selected
          setSelectedItems((prev) => prev.filter((i) => i !== id));
          // Force refetch to update duplicate detection immediately
          await refetchAllParts();
          console.log("🔄 Refetched allPartsForTotals after delete");
          showToast.success(`Đã xóa phụ tùng "${part.name}"`);
        },
        onError: (error) => {
          console.error("Delete error:", error);
          showToast.error(`Không thể xóa: ${error.message}`);
        },
      }
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showToast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    const confirmed = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      confirmColor: "red",
    });

    if (!confirmed) return;

    // Track progress for bulk delete
    let successCount = 0;
    let errorCount = 0;
    const totalCount = selectedItems.length;

    // Delete all selected items
    selectedItems.forEach((id, index) => {
      deletePartMutation.mutate(
        { id },
        {
          onSuccess: async () => {
            successCount++;
            // Show toast only after last item
            if (successCount + errorCount === totalCount) {
              // Force refetch to update duplicate detection immediately
              await refetchAllParts();
              console.log("🔄 Refetched allPartsForTotals after bulk delete");
              if (errorCount === 0) {
                showToast.success(`Đã xóa ${successCount} phụ tùng`);
              } else {
                showToast.warning(
                  `Đã xóa ${successCount}/${totalCount} phụ tùng (${errorCount} lỗi)`
                );
              }
            }
          },
          onError: (error) => {
            console.error(`Delete error for item ${id}:`, error);
            errorCount++;
            // Show toast only after last item
            if (successCount + errorCount === totalCount) {
              if (successCount === 0) {
                showToast.error(`Không thể xóa ${totalCount} phụ tùng`);
              } else {
                showToast.warning(
                  `Đã xóa ${successCount}/${totalCount} phụ tùng (${errorCount} lỗi)`
                );
              }
            }
          },
        }
      );
    });

    setSelectedItems([]);
  };

  // Handle export to Excel
  const handleExportExcel = () => {
    try {
      const now = new Date();
      const filename = `ton-kho-${now.getDate()}-${
        now.getMonth() + 1
      }-${now.getFullYear()}.xlsx`;
      exportPartsToExcel(repoParts, currentBranchId, filename);
      showToast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Export error:", error);
      showToast.error("Có lỗi khi xuất file Excel");
    }
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    try {
      exportInventoryTemplate();
      showToast.success(
        "Tải template thành công! Vui lòng điền thông tin và import lại."
      );
    } catch (error) {
      console.error("Template download error:", error);
      showToast.error("Có lỗi khi tải template");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 sm:bg-[#1e293b]">
      {/* Desktop Header - Giữ nguyên như cũ */}
      <div className="hidden sm:block bg-primary-bg border-b border-primary-border px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              {
                key: "stock",
                label: "Tồn kho",
                icon: <Boxes className="w-4 h-4" />,
              },
              {
                key: "categories",
                label: "Danh mục",
                icon: <Package className="w-4 h-4" />,
              },
              {
                key: "lookup",
                label: "Tra cứu",
                icon: <Search className="w-4 h-4" />,
              },
              {
                key: "history",
                label: "Lịch sử",
                icon: <FileText className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-secondary-text hover:bg-tertiary-bg"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGoodsReceipt(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo phiếu nhập
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
              <Repeat className="w-4 h-4" />
              Chuyển kho
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Xuất Excel
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              Nhập CSV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header - Compact & Clean */}
      <div className="sm:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-3">
        {/* Search and Create Button Row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc SKU..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowGoodsReceipt(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu
          </button>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400">Tổng:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {totalStockQuantity.toLocaleString()} sp
              </span>
            </div>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400">
                Giá trị:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalStockValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Filters - Hidden on Mobile */}
      <div className="hidden sm:block bg-primary-bg border-b border-primary-border px-4 py-4">
        <div className="flex items-start gap-4">
          {/* Left Side - Stats Cards */}
          <div className="flex gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 min-w-[140px]">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                Tổng SL tồn
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalStockQuantity.toLocaleString()}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 min-w-[140px]">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                Tổng giá trị tồn
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(totalStockValue)}
              </p>
            </div>
          </div>

          {/* Right Side - Search and Filters */}
          <div className="flex-1 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc SKU..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-primary-border rounded-lg bg-primary-bg text-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={stockFilter}
              onChange={(e) => {
                setPage(1);
                setStockFilter(e.target.value);
              }}
              className="px-4 py-2.5 border border-primary-border rounded-lg bg-primary-bg text-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap"
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in-stock">Còn hàng</option>
              <option value="low-stock">Sắp hết</option>
              <option value="out-of-stock">Hết hàng</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setPage(1);
                setCategoryFilter(e.target.value);
              }}
              className="px-4 py-2.5 border border-primary-border rounded-lg bg-primary-bg text-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap"
            >
              <option value="all">Tất cả danh mục</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {activeTab === "stock" && (
          <div className="space-y-3">
            {/* Duplicate Warning Banner */}
            {duplicateNames.size > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1">
                      Phát hiện {duplicateNames.size} sản phẩm trùng tên
                    </h3>
                    <button
                      onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                      className={`mt-1 px-2 py-1 rounded text-xs font-medium transition ${
                        showDuplicatesOnly
                          ? "bg-orange-600 text-white"
                          : "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300"
                      }`}
                    >
                      {showDuplicatesOnly ? "✓ Đang lọc" : "🔍 Lọc"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Table + Pagination */}
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {/* Bulk Actions Bar */}
              {selectedItems.length > 0 && (
                <div className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 border-b border-primary-border flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Đã chọn {selectedItems.length} sản phẩm
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Xóa đã chọn
                  </button>
                </div>
              )}

              {/* Mobile: stacked cards (visible on small screens) */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-3">
                  {filteredParts.map((part, index) => {
                    const stock = part.stock[currentBranchId] || 0;
                    const retailPrice = part.retailPrice[currentBranchId] || 0;
                    const value = stock * retailPrice;
                    const isDuplicate = hasDuplicateName(part.name);
                    return (
                      <div
                        key={part.id}
                        className={`flex items-center gap-3 p-3 rounded-xl bg-[#2d3748] border border-slate-600 transition ${
                          isDuplicate ? "border-l-4 border-l-orange-500" : ""
                        }`}
                        role="listitem"
                      >
                        <div className="w-14 h-14 bg-slate-600 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                          {part.imageUrl ? (
                            <img
                              src={part.imageUrl}
                              alt={part.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                backgroundColor: getCategoryColor(
                                  part.category
                                ),
                              }}
                            >
                              <Package className="w-6 h-6 text-white opacity-90" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[15px] font-medium text-white truncate">
                                {part.name}
                              </div>
                              <div className="text-[13px] text-slate-400 mt-0.5">
                                SKU: {part.sku} • {part.category}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-[13px] text-slate-300">
                                {formatCurrency(value)} ₫
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`inline-flex px-2 py-0.5 text-sm font-bold rounded ${
                                stock === 0
                                  ? "text-red-400 bg-red-900/30"
                                  : stock < 10
                                  ? "text-yellow-400 bg-yellow-900/30"
                                  : "text-emerald-400 bg-emerald-900/30"
                              }`}
                            >
                              {stock}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setMobileMenuOpenIndex(
                                    mobileMenuOpenIndex === index ? null : index
                                  )
                                }
                                aria-haspopup="true"
                                aria-expanded={mobileMenuOpenIndex === index}
                                aria-label="Thêm hành động"
                                className="p-1.5 text-slate-400 hover:bg-slate-600 rounded transition"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {mobileMenuOpenIndex === index && (
                                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                                  <button
                                    onClick={() => {
                                      setEditingPart(part);
                                      setMobileMenuOpenIndex(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex items-center gap-2 text-white"
                                    aria-label={`Chỉnh sửa ${part.name}`}
                                  >
                                    <Edit className="w-4 h-4 text-blue-400" />
                                    <span>Chỉnh sửa</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteItem(part.id);
                                      setMobileMenuOpenIndex(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex items-center gap-2 text-red-400"
                                    aria-label={`Xóa ${part.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop / tablet: wide table (hidden on small screens) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-tertiary-bg">
                    <tr className="border-b border-primary-border">
                      <th className="px-6 py-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === filteredParts.length &&
                            filteredParts.length > 0
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-secondary-border focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        STT
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Tên sản phẩm
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Giá nhập
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Giá bán lẻ
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Giá bán sỉ
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Giá trị
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-primary-bg divide-y divide-primary-border">
                    {filteredParts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-8 text-center text-tertiary-text"
                        >
                          <div className="text-6xl mb-4">🗂️</div>
                          <div className="text-lg">Không có sản phẩm nào</div>
                          <div className="text-sm">
                            Hãy thử một bộ lọc khác hoặc thêm sản phẩm mới
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredParts.map((part, index) => {
                        const stock = part.stock[currentBranchId] || 0;
                        const retailPrice =
                          part.retailPrice[currentBranchId] || 0;
                        const wholesalePrice =
                          part.wholesalePrice?.[currentBranchId] || 0;
                        const costPrice =
                          part.costPrice?.[currentBranchId] || 0;
                        const value = stock * retailPrice;
                        const isSelected = selectedItems.includes(part.id);
                        const isDuplicate = hasDuplicateName(part.name);

                        return (
                          <tr
                            key={part.id}
                            className={`border-b border-primary-border hover:bg-tertiary-bg transition-colors ${
                              isSelected
                                ? "bg-blue-900/20 dark:bg-blue-900/20"
                                : isDuplicate
                                ? "bg-orange-500/10 border-l-4 border-l-orange-500"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) =>
                                  handleSelectItem(part.id, e.target.checked)
                                }
                                className="w-4 h-4 text-blue-600 rounded border-secondary-border focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="text-sm font-medium text-primary-text">
                                    {part.name}
                                  </div>
                                  <div className="text-xs text-tertiary-text">
                                    SKU: {part.sku}
                                  </div>
                                </div>
                                {isDuplicate && (
                                  <span
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700"
                                    title="Sản phẩm có tên trùng lặp"
                                  >
                                    ⚠️ Trùng
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                              {part.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-3 py-1 text-sm font-bold rounded ${
                                  stock === 0
                                    ? "text-red-600 dark:text-red-400"
                                    : stock < 10
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-secondary-text">
                              {formatCurrency(costPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-primary-text font-medium">
                              {formatCurrency(retailPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-secondary-text">
                              {formatCurrency(wholesalePrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-primary-text">
                              {formatCurrency(value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setEditingPart(part)}
                                  className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(part.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                  title="Xóa"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-primary-border bg-primary-bg">
                <div className="text-sm text-secondary-text">
                  Trang {page}/{totalPages} • Tổng {totalParts} phụ tùng
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1 || partsLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-secondary-border rounded disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <button
                    disabled={page >= totalPages || partsLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border border-secondary-border rounded disabled:opacity-40"
                  >
                    Sau →
                  </button>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value) || 20;
                      setPageSize(newSize);
                      setPage(1);
                    }}
                    className="px-2 py-1.5 border border-secondary-border rounded"
                  >
                    {[10, 20, 50, 100].map((s) => (
                      <option key={s} value={s}>
                        {s}/trang
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <InventoryHistorySection transactions={invTx} />
        )}

        {activeTab === "categories" && (
          <div className="bg-[#0f172a] -m-6">
            <CategoriesManager />
          </div>
        )}

        {activeTab === "lookup" && (
          <div className="bg-[#0f172a] -m-6">
            <LookupManager />
          </div>
        )}
      </div>

      {/* Modals */}
      <GoodsReceiptModal
        isOpen={showGoodsReceipt}
        onClose={() => setShowGoodsReceipt(false)}
        parts={repoParts}
        currentBranchId={currentBranchId}
        onSave={handleSaveGoodsReceipt}
      />

      {/* Edit Part Modal */}
      {editingPart && (
        <EditPartModal
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSave={(updatedPart) => {
            console.log("💾 Saving part updates:", updatedPart);
            // Only send fields that are allowed in database schema
            const updates: Partial<Part> = {
              name: updatedPart.name,
              category: updatedPart.category,
              stock: updatedPart.stock,
              retailPrice: updatedPart.retailPrice,
              wholesalePrice: updatedPart.wholesalePrice,
            };
            // Try to add costPrice if it exists in schema
            if (updatedPart.costPrice) {
              updates.costPrice = updatedPart.costPrice;
            }
            console.log("📤 Sending updates:", updates);
            updatePartMutation.mutate({
              id: updatedPart.id,
              updates,
            });
            setEditingPart(null);
          }}
          currentBranchId={currentBranchId}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportInventoryModal
          onClose={() => setShowImportModal(false)}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={async (file) => {
            try {
              const { items: importedData, errors: rowErrors } =
                await importPartsFromExcelDetailed(file, currentBranchId);

              if (importedData.length === 0) {
                const msg = rowErrors.length
                  ? `Không import được: ${rowErrors.slice(0, 3).join("; ")}`
                  : "File không có dữ liệu hợp lệ";
                throw new Error(msg);
              }

              // OPTIMIZATION: Batch fetch all parts by SKU in one query
              const allSkus = importedData.map((item) => item.sku);
              console.log(`🔍 Checking ${allSkus.length} SKUs...`);

              // Check for duplicate SKUs in import file
              const skuCounts = new Map<string, number>();
              allSkus.forEach((sku) => {
                skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
              });
              const duplicates = Array.from(skuCounts.entries())
                .filter(([_, count]) => count > 1)
                .map(([sku, count]) => `${sku}(${count}x)`);

              if (duplicates.length > 0) {
                console.warn(
                  `⚠️ Duplicate SKUs in file: ${duplicates
                    .slice(0, 5)
                    .join(", ")}`
                );
              }

              // Fetch existing parts in chunks (Supabase .in() has URL length limit)
              const uniqueSkus = Array.from(new Set(allSkus));
              const CHUNK_SIZE = 100; // Process 100 SKUs per request
              const allExistingParts: any[] = [];

              for (let i = 0; i < uniqueSkus.length; i += CHUNK_SIZE) {
                const chunk = uniqueSkus.slice(i, i + CHUNK_SIZE);
                const { data, error } = await supabase
                  .from("parts")
                  .select("*")
                  .in("sku", chunk);

                if (error) {
                  console.error(
                    `❌ Fetch chunk ${i / CHUNK_SIZE + 1} error:`,
                    error
                  );
                  throw new Error(`Lỗi kiểm tra phụ tùng: ${error.message}`);
                }

                if (data) {
                  allExistingParts.push(...data);
                }
              }

              console.log(`✅ Found ${allExistingParts.length} existing parts`);

              const existingPartsMap = new Map(
                allExistingParts.map((p) => [p.sku, p])
              );

              // Prepare batch operations
              const partsToCreate: any[] = [];
              const partsToUpdate: any[] = [];
              const inventoryTxToCreate: any[] = [];
              const processedSkus = new Set<string>(); // Track processed SKUs to avoid duplicates
              let createdCount = 0;
              let updatedCount = 0;
              let skippedCount = 0;
              const importDate = new Date().toISOString();

              for (const item of importedData) {
                // Skip if SKU already processed (duplicate in file)
                if (processedSkus.has(item.sku)) {
                  console.warn(
                    `⚠️ Skipping duplicate SKU in file: ${item.sku}`
                  );
                  skippedCount++;
                  continue;
                }
                processedSkus.add(item.sku);

                const existingPart = existingPartsMap.get(item.sku);

                if (existingPart) {
                  // Update existing part
                  updatedCount += 1;
                  partsToUpdate.push({
                    id: existingPart.id,
                    stock: {
                      ...existingPart.stock,
                      [currentBranchId]:
                        (existingPart.stock[currentBranchId] || 0) +
                        item.quantity,
                    },
                    costPrice: {
                      ...existingPart.costPrice,
                      [currentBranchId]: item.costPrice,
                    },
                    retailPrice: {
                      ...existingPart.retailPrice,
                      [currentBranchId]: item.retailPrice,
                    },
                    wholesalePrice: {
                      ...existingPart.wholesalePrice,
                      [currentBranchId]: item.wholesalePrice,
                    },
                  });

                  // Prepare inventory transaction
                  inventoryTxToCreate.push({
                    type: "Nhập kho",
                    date: importDate,
                    branchId: currentBranchId,
                    partId: existingPart.id,
                    partName: item.name,
                    quantity: item.quantity,
                    unitPrice: item.retailPrice,
                    totalPrice: item.quantity * item.retailPrice,
                    notes: `Nhập kho từ file Excel`,
                  });
                } else {
                  // Create new part
                  createdCount += 1;
                  const newPartId =
                    crypto?.randomUUID?.() ||
                    `${Math.random().toString(36).slice(2)}-${Date.now()}`;

                  partsToCreate.push({
                    id: newPartId,
                    name: item.name,
                    sku: item.sku,
                    category: item.category,
                    description: item.description,
                    stock: {
                      [currentBranchId]: item.quantity,
                    },
                    costPrice: {
                      [currentBranchId]: item.costPrice,
                    },
                    retailPrice: {
                      [currentBranchId]: item.retailPrice,
                    },
                    wholesalePrice: {
                      [currentBranchId]: item.wholesalePrice,
                    },
                  });

                  // Prepare inventory transaction
                  inventoryTxToCreate.push({
                    type: "Nhập kho",
                    date: importDate,
                    branchId: currentBranchId,
                    partId: newPartId,
                    partName: item.name,
                    quantity: item.quantity,
                    unitPrice: item.retailPrice,
                    totalPrice: item.quantity * item.retailPrice,
                    notes: `Nhập kho từ file Excel`,
                  });
                }
              }

              // BATCH: Execute all creates
              if (partsToCreate.length > 0) {
                const { data: createdParts, error: createError } =
                  await supabase.from("parts").insert(partsToCreate).select();

                if (createError) {
                  console.error("❌ Batch create error:", createError);
                  throw new Error(`Lỗi tạo phụ tùng: ${createError.message}`);
                }
                console.log(`✅ Created ${createdParts?.length || 0} parts`);
              }

              // BATCH: Execute all updates
              if (partsToUpdate.length > 0) {
                let updateSuccess = 0;
                let updateFailed = 0;

                for (const update of partsToUpdate) {
                  const { error } = await supabase
                    .from("parts")
                    .update({
                      stock: update.stock,
                      costPrice: update.costPrice,
                      retailPrice: update.retailPrice,
                      wholesalePrice: update.wholesalePrice,
                    })
                    .eq("id", update.id);

                  if (error) {
                    console.error(
                      `❌ Update error for part ${update.id}:`,
                      error
                    );
                    updateFailed++;
                  } else {
                    updateSuccess++;
                  }
                }
                console.log(
                  `✅ Updated ${updateSuccess}/${partsToUpdate.length} parts`
                );
              }

              // BATCH: Create inventory transactions
              if (inventoryTxToCreate.length > 0) {
                const { error: txError } = await supabase
                  .from("inventory_transactions")
                  .insert(inventoryTxToCreate);

                if (txError) {
                  console.warn("⚠️ Inventory transactions error:", txError);
                  // Don't throw - transactions are not critical
                }
              }

              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ["partsRepo"] });
              queryClient.invalidateQueries({ queryKey: ["partsRepoPaged"] });

              // Audit summary for import (best-effort)
              try {
                const { data: userData } = await supabase.auth.getUser();
                await safeAudit(userData?.user?.id || null, {
                  action: "inventory.import",
                  tableName: "inventory_transactions",
                  oldData: null,
                  newData: {
                    totalRows: importedData.length + rowErrors.length,
                    created: createdCount,
                    updated: updatedCount,
                    skipped: rowErrors.length,
                    sampleErrors: rowErrors.slice(0, 10),
                    branchId: currentBranchId,
                    at: importDate,
                  },
                });
              } catch {}

              setShowImportModal(false);

              let summaryMsg = `Import: tạo mới ${createdCount}, cập nhật ${updatedCount}`;
              if (skippedCount > 0) {
                summaryMsg += `, bỏ qua ${skippedCount} SKU trùng`;
              }
              if (rowErrors.length > 0) {
                summaryMsg += `, ${rowErrors.length} dòng lỗi`;
              }

              showToast.success(summaryMsg);
            } catch (error) {
              console.error("❌ Import error:", error);
              showToast.error(`Lỗi import: ${error}`);
            }
          }}
        />
      )}

      {/* Confirm Modal */}
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

      {/* Mobile Floating Action Buttons */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3">
        <button
          onClick={() => setShowGoodsReceipt(true)}
          className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110"
          aria-label="Tạo phiếu nhập"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={handleExportExcel}
          className="w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110"
          aria-label="Xuất Excel"
        >
          <Repeat className="w-6 h-6" />
        </button>
      </div>

      {/* Custom Bottom Navigation for Inventory */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition ${
              activeTab === "stock"
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tồn kho</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition ${
              activeTab === "categories"
                ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium">Danh mục</span>
          </button>
          <button
            onClick={() => setActiveTab("lookup")}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition ${
              activeTab === "lookup"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tra cứu</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition ${
              activeTab === "history"
                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lịch sử</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Import Inventory Modal Component
interface ImportInventoryModalProps {
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImport: (file: File) => Promise<void>;
}

const ImportInventoryModal: React.FC<ImportInventoryModalProps> = ({
  onClose,
  onDownloadTemplate,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        setSelectedFile(file);
      } else {
        showToast.warning(
          "Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)"
        );
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showToast.warning("Vui lòng chọn file để import");
      return;
    }

    setIsProcessing(true);
    try {
      await onImport(selectedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Nhập tồn kho từ Excel/CSV
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Hướng dẫn sử dụng
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Tải file template mẫu</li>
                  <li>Điền thông tin sản phẩm vào file</li>
                  <li>Lưu file và chọn để import</li>
                </ol>
                <button
                  onClick={onDownloadTemplate}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  📥 Tải Template Excel
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Chọn file để import
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-slate-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Click để chọn file Excel hoặc CSV
                </span>
                {selectedFile && (
                  <span className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    ✓ {selectedFile.name}
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Đang xử lý..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Part Modal Component
interface EditPartModalProps {
  part: Part;
  onClose: () => void;
  onSave: (part: Partial<Part> & { id: string }) => void;
  currentBranchId: string;
}

const EditPartModal: React.FC<EditPartModalProps> = ({
  part,
  onClose,
  onSave,
  currentBranchId,
}) => {
  const [formData, setFormData] = useState({
    name: part.name,
    category: part.category || "",
    retailPrice: part.retailPrice[currentBranchId] || 0,
    wholesalePrice: part.wholesalePrice?.[currentBranchId] || 0,
    costPrice: part.costPrice?.[currentBranchId] || 0,
    stock: part.stock[currentBranchId] || 0,
  });
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const [showInlineCat, setShowInlineCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast.warning("Vui lòng nhập tên sản phẩm");
      return;
    }

    onSave({
      id: part.id,
      name: formData.name.trim(),
      category: formData.category.trim() || undefined,
      stock: {
        ...part.stock,
        [currentBranchId]: formData.stock,
      },
      costPrice: {
        ...part.costPrice,
        [currentBranchId]: formData.costPrice,
      },
      retailPrice: {
        ...part.retailPrice,
        [currentBranchId]: formData.retailPrice,
      },
      wholesalePrice: {
        ...part.wholesalePrice,
        [currentBranchId]: formData.wholesalePrice,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Chỉnh sửa sản phẩm
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Danh mục
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                  title="Thêm danh mục mới"
                >
                  +
                </button>
              </div>
              {showInlineCat && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = inlineCatName.trim();
                    if (!trimmed)
                      return showToast.warning("Vui lòng nhập tên danh mục");
                    try {
                      const res = await createCategory.mutateAsync({
                        name: trimmed,
                      });
                      setFormData({ ...formData, category: res.name });
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
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineCat(false);
                      setInlineCatName("");
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >
                    Hủy
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Giá nhập
              </label>
              <input
                type="number"
                value={formData.costPrice || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Giá bán lẻ
              </label>
              <input
                type="number"
                value={formData.retailPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    retailPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Giá bán sỉ
              </label>
              <input
                type="number"
                value={formData.wholesalePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesalePrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                min="0"
              />
            </div>
          </div>

          {/* Stock adjustment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tồn kho hiện tại
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              min="0"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Số lượng tồn kho tại chi nhánh hiện tại
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <div className="font-medium mb-1">Lưu ý:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Bạn có thể chỉnh sửa trực tiếp giá nhập, giá bán và tồn kho
                </li>
                <li>
                  Hoặc sử dụng "Tạo phiếu nhập" để ghi nhận lịch sử nhập kho chi
                  tiết
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryManager;
