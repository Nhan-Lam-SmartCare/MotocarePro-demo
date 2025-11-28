import React, { useState } from "react";
import {
  Boxes,
  LineChart,
  HandCoins,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import InventoryAnalytics from "./InventoryAnalytics";
import SalesAnalytics from "./SalesAnalytics";
import FinancialAnalytics from "./FinancialAnalytics";
import {
  exportInventoryReport,
  exportSalesReport,
  exportFinancialReport,
  exportLowStockReport,
} from "../../utils/pdfExport";
import { showToast } from "../../utils/toast";

type TabType = "inventory" | "sales" | "financial";

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const {
    parts,
    sales,
    inventoryTransactions,
    customerDebts,
    supplierDebts,
    currentBranchId,
  } = useAppContext();

  const handleExportPDF = () => {
    try {
      switch (activeTab) {
        case "inventory":
          exportInventoryReport(parts, currentBranchId);
          showToast.success("Đã xuất báo cáo tồn kho thành công!");
          break;
        case "sales":
          exportSalesReport(sales, parts);
          showToast.success("Đã xuất báo cáo bán hàng thành công!");
          break;
        case "financial":
          exportFinancialReport(
            sales,
            inventoryTransactions,
            parts,
            currentBranchId,
            customerDebts,
            supplierDebts
          );
          showToast.success("Đã xuất báo cáo tài chính thành công!");
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast.error("Lỗi khi xuất báo cáo PDF");
    }
  };

  const handleExportLowStock = () => {
    try {
      exportLowStockReport(parts, currentBranchId);
      showToast.success("Đã xuất báo cáo cảnh báo tồn kho!");
    } catch (error) {
      console.error("Export error:", error);
      showToast.error("Lỗi khi xuất báo cáo");
    }
  };

  const tabs = [
    {
      id: "inventory" as const,
      label: "Tồn kho",
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      id: "sales" as const,
      label: "Bán hàng",
      icon: <HandCoins className="w-4 h-4" />,
    },
    {
      id: "financial" as const,
      label: "Tài chính",
      icon: <LineChart className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Báo cáo & Phân tích
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Theo dõi và phân tích hiệu suất kinh doanh
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex gap-2">
            {activeTab === "inventory" && (
              <button
                onClick={handleExportLowStock}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm"
              >
                <AlertTriangle className="w-4 h-4" /> Cảnh báo tồn kho
              </button>
            )}
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm"
            >
              <FileText className="w-4 h-4" /> Xuất PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-all relative text-sm ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === "inventory" && <InventoryAnalytics />}
        {activeTab === "sales" && <SalesAnalytics />}
        {activeTab === "financial" && <FinancialAnalytics />}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
