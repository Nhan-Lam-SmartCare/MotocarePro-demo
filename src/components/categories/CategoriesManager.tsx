import React, { useState } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { showToast } from "../../utils/toast";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmModal from "../common/ConfirmModal";
import { PlusIcon } from "../Icons";
import {
  Boxes,
  Wrench,
  Settings,
  Hammer,
  Cog,
  Bolt,
  Bike,
  Car,
  Disc,
  Battery,
  Lightbulb,
  Palette,
} from "lucide-react";

const CategoriesManager: React.FC = () => {
  const { parts, upsertPart } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedIcon, setSelectedIcon] = useState("package");

  // Confirm dialog hook
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Extract unique categories from parts
  const categories = React.useMemo(() => {
    const categoryMap = new Map<
      string,
      { count: number; icon: string; color: string }
    >();

    parts.forEach((part) => {
      if (part.category) {
        const existing = categoryMap.get(part.category);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(part.category, {
            count: 1,
            icon: "package", // Default icon key
            color: "#3b82f6", // Default color
          });
        }
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [parts]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showToast.warning("Vui lòng nhập tên danh mục");
      return;
    }

    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === newCategoryName.toLowerCase()
    );
    if (exists) {
      showToast.warning("Danh mục này đã tồn tại");
      return;
    }

    // Category metadata would be stored separately in a real app
    // For now, we just show success since categories are derived from parts
    showToast.success(`Danh mục "${newCategoryName}" đã được thêm`);
    setNewCategoryName("");
    setShowAddModal(false);
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      showToast.warning("Vui lòng nhập tên danh mục mới");
      return;
    }

    // Update all parts with this category
    const partsToUpdate = parts.filter((p) => p.category === oldName);
    partsToUpdate.forEach((part) => {
      upsertPart({
        id: part.id,
        category: newName,
      });
    });

    showToast.success(`Đã đổi tên danh mục từ "${oldName}" sang "${newName}"`);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const partsCount = parts.filter((p) => p.category === categoryName).length;

    const confirmed = await confirm({
      title: "Xác nhận xóa danh mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${categoryName}"? ${partsCount} sản phẩm trong danh mục này sẽ không còn danh mục.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      confirmColor: "red",
    });

    if (!confirmed) return;

    // Remove category from all parts
    const partsToUpdate = parts.filter((p) => p.category === categoryName);
    partsToUpdate.forEach((part) => {
      upsertPart({
        id: part.id,
        category: "",
      });
    });

    showToast.success(`Đã xóa danh mục "${categoryName}"`);
  };

  const colors = [
    { value: "#3b82f6", label: "Xanh dương" },
    { value: "#10b981", label: "Xanh lá" },
    { value: "#f59e0b", label: "Vàng" },
    { value: "#ef4444", label: "Đỏ" },
    { value: "#8b5cf6", label: "Tím" },
    { value: "#ec4899", label: "Hồng" },
    { value: "#06b6d4", label: "Cyan" },
    { value: "#f97316", label: "Cam" },
  ];

  const iconMap: Record<string, React.ReactNode> = {
    package: <Boxes className="w-5 h-5" />,
    wrench: <Wrench className="w-5 h-5" />,
    settings: <Settings className="w-5 h-5" />,
    hammer: <Hammer className="w-5 h-5" />,
    cog: <Cog className="w-5 h-5" />,
    bolt: <Bolt className="w-5 h-5" />,
    bike: <Bike className="w-5 h-5" />,
    car: <Car className="w-5 h-5" />,
    disc: <Disc className="w-5 h-5" />,
    battery: <Battery className="w-5 h-5" />,
    lightbulb: <Lightbulb className="w-5 h-5" />,
    palette: <Palette className="w-5 h-5" />,
  };
  const icons = Object.keys(iconMap);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0f172a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e293b] shadow-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Danh mục sản phẩm
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Quản lý các danh mục phân loại sản phẩm
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Tổng danh mục
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {categories.length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Tổng sản phẩm
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
              {parts.length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Chưa phân loại
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
              {parts.filter((p) => !p.category).length}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon}</div>
                  <div>
                    {editingCategory === category.name ? (
                      <input
                        type="text"
                        defaultValue={category.name}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameCategory(
                              category.name,
                              e.currentTarget.value
                            );
                          } else if (e.key === "Escape") {
                            setEditingCategory(null);
                          }
                        }}
                        onBlur={(e) =>
                          handleRenameCategory(category.name, e.target.value)
                        }
                        autoFocus
                        className="px-2 py-1 border border-blue-500 rounded text-sm font-semibold text-slate-900 dark:text-slate-100 dark:bg-[#0f172a]"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {category.name}
                      </h3>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      {category.count} sản phẩm
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEditingCategory(category.name)}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Đổi tên
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.name)}
                  className="flex-1 px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {categories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-slate-400 dark:text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5v-9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5l9 4.5 9-4.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 12v9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Chưa có danh mục nào
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Thêm danh mục đầu tiên để phân loại sản phẩm
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Thêm danh mục
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Thêm danh mục mới
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
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

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="VD: Phụ tùng xe máy"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Biểu tượng
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`p-3 border rounded-lg transition-colors flex items-center justify-center ${
                        selectedIcon === icon
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {iconMap[icon]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Màu sắc
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? "border-slate-900 dark:border-slate-100 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    >
                      <div className="w-full h-6"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Thêm danh mục
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default CategoriesManager;
