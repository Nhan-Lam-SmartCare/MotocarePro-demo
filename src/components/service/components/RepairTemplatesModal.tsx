/**
 * RepairTemplatesModal.tsx
 * Component quản lý mẫu sửa chữa thường dùng
 */

import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { formatCurrency } from "../../../utils/format";
import {
  useRepairTemplates,
  useCreateRepairTemplate,
  useUpdateRepairTemplate,
  useDeleteRepairTemplate,
} from "../../../hooks/useRepairTemplatesRepository";
import type { Part } from "../../../types";

interface TemplatePart {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  laborCost: number;
  parts: TemplatePart[];
}

interface RepairTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ServiceTemplate) => void;
  parts: Part[];
  currentBranchId: string | null;
}

export function RepairTemplatesModal({
  isOpen,
  onClose,
  onApplyTemplate,
  parts,
  currentBranchId,
}: RepairTemplatesModalProps) {
  // Fetch templates from database
  const { data: repairTemplatesData, isLoading } = useRepairTemplates();
  const createTemplateMutation = useCreateRepairTemplate();
  const updateTemplateMutation = useUpdateRepairTemplate();
  const deleteTemplateMutation = useDeleteRepairTemplate();

  // Local state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ServiceTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    description: "",
    duration: 30,
    laborCost: 0,
    parts: [] as TemplatePart[],
  });
  const [partSearchIndex, setPartSearchIndex] = useState<number | null>(null);
  const [partSearchTerm, setPartSearchTerm] = useState("");

  // Convert database format to display format
  const serviceTemplates = useMemo(() => {
    if (!repairTemplatesData) return [];
    return repairTemplatesData.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      duration: t.duration,
      laborCost: t.labor_cost,
      parts: t.parts || [],
    }));
  }, [repairTemplatesData]);

  // Filter parts for autocomplete
  const filteredParts = useMemo(() => {
    if (partSearchIndex === null) return [];
    const term = partSearchTerm.toLowerCase();
    if (!term) return parts.slice(0, 5);
    return parts
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 10);
  }, [parts, partSearchIndex, partSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".template-part-input")) {
        setPartSearchIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      id: "",
      name: "",
      description: "",
      duration: 30,
      laborCost: 0,
      parts: [],
    });
    setShowEditor(true);
  };

  const handleEditTemplate = (template: ServiceTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      id: template.id,
      name: template.name,
      description: template.description,
      duration: template.duration,
      laborCost: template.laborCost,
      parts: [...template.parts],
    });
    setShowEditor(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          updates: {
            name: templateForm.name,
            description: templateForm.description,
            duration: templateForm.duration,
            labor_cost: templateForm.laborCost,
            parts: templateForm.parts,
          },
        });
      } else {
        await createTemplateMutation.mutateAsync({
          name: templateForm.name,
          description: templateForm.description,
          duration: templateForm.duration,
          labor_cost: templateForm.laborCost,
          parts: templateForm.parts,
        });
      }
      setShowEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Bạn có chắc muốn xóa mẫu sửa chữa này?")) return;
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleAddPart = () => {
    setTemplateForm({
      ...templateForm,
      parts: [
        ...templateForm.parts,
        { name: "", quantity: 1, price: 0, unit: "cái" },
      ],
    });
  };

  const handleRemovePart = (index: number) => {
    setTemplateForm({
      ...templateForm,
      parts: templateForm.parts.filter((_, i) => i !== index),
    });
  };

  const handleUpdatePart = (index: number, field: string, value: any) => {
    const updatedParts = [...templateForm.parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setTemplateForm({ ...templateForm, parts: updatedParts });

    if (field === "name") {
      setPartSearchIndex(index);
      setPartSearchTerm(value);
    }
  };

  const handleSelectPartFromInventory = (index: number, part: Part) => {
    const updatedParts = [...templateForm.parts];
    updatedParts[index] = {
      ...updatedParts[index],
      name: part.name,
      price: part.retailPrice?.[currentBranchId || ""] || 0,
      unit: "cái",
    };
    setTemplateForm({ ...templateForm, parts: updatedParts });
    setPartSearchIndex(null);
    setPartSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Template List Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Mẫu sửa chữa thường dùng
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateTemplate}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tạo mẫu mới
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Chọn mẫu sửa chữa để tự động điền thông tin vào phiếu sửa chữa
            </p>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                Đang tải...
              </div>
            ) : serviceTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Chưa có mẫu sửa chữa nào
                </p>
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Tạo mẫu đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {serviceTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {template.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {template.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {template.duration} phút
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            template.laborCost +
                              template.parts.reduce(
                                (s, p) => s + p.price * p.quantity,
                                0
                              )
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Phụ tùng cần thiết:
                      </p>
                      {template.parts.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Không có phụ tùng
                        </p>
                      ) : (
                        template.parts.map((part, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs text-slate-500 dark:text-slate-400"
                          >
                            <span>
                              {part.name} x{part.quantity} {part.unit}
                            </span>
                            <span>
                              {formatCurrency(part.price * part.quantity)}
                            </span>
                          </div>
                        ))
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onApplyTemplate(template)}
                          className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                        >
                          Áp dụng
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingTemplate ? "Sửa mẫu sửa chữa" : "Tạo mẫu sửa chữa mới"}
              </h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tên mẫu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thay dầu động cơ"
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả chi tiết dịch vụ..."
                    value={templateForm.description}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                  />
                </div>

                {/* Duration & Labor Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Thời gian (phút)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={templateForm.duration}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          duration: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chi phí công
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="0"
                      value={templateForm.laborCost || ""}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          laborCost: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Parts List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phụ tùng cần thiết
                    </label>
                    <button
                      onClick={handleAddPart}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm phụ tùng
                    </button>
                  </div>

                  {templateForm.parts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                      Chưa có phụ tùng nào. Nhấn "Thêm phụ tùng" để thêm.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templateForm.parts.map((part, index) => (
                        <div
                          key={index}
                          className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <div className="col-span-2 relative template-part-input">
                              <input
                                type="text"
                                placeholder="Tên phụ tùng"
                                value={part.name}
                                onChange={(e) =>
                                  handleUpdatePart(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                onFocus={() => {
                                  setPartSearchIndex(index);
                                  setPartSearchTerm(part.name);
                                }}
                                className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                              />
                              {/* Autocomplete dropdown */}
                              {partSearchIndex === index && (
                                <div className="absolute z-[70] top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                                  {filteredParts.length > 0 ? (
                                    filteredParts.map((inventoryPart) => (
                                      <button
                                        key={inventoryPart.id}
                                        type="button"
                                        onClick={() =>
                                          handleSelectPartFromInventory(
                                            index,
                                            inventoryPart
                                          )
                                        }
                                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                              {inventoryPart.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                              Tồn kho:{" "}
                                              {inventoryPart.stock?.[
                                                currentBranchId || ""
                                              ] || 0}{" "}
                                              cái
                                            </div>
                                          </div>
                                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {formatCurrency(
                                              inventoryPart.retailPrice?.[
                                                currentBranchId || ""
                                              ] || 0
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                      {!parts || parts.length === 0
                                        ? "Không có phụ tùng trong kho"
                                        : "Không tìm thấy phụ tùng phù hợp"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <input
                              type="number"
                              min="1"
                              placeholder="SL"
                              value={part.quantity}
                              onChange={(e) =>
                                handleUpdatePart(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              placeholder="Đơn giá"
                              value={part.price || ""}
                              onChange={(e) =>
                                handleUpdatePart(
                                  index,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                              className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => handleRemovePart(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Preview */}
                {(templateForm.laborCost > 0 ||
                  templateForm.parts.length > 0) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Chi phí công:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(templateForm.laborCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Phụ tùng:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(
                            templateForm.parts.reduce(
                              (sum, p) => sum + p.price * p.quantity,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          Tổng ước tính:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            templateForm.laborCost +
                              templateForm.parts.reduce(
                                (sum, p) => sum + p.price * p.quantity,
                                0
                              )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name.trim()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {editingTemplate ? "Cập nhật" : "Tạo mẫu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
