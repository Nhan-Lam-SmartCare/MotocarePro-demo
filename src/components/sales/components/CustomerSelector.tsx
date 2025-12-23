import React from "react";
import type { Customer } from "../../../types";
import { Search, UserPlus, X } from "lucide-react";

interface CustomerSelectorProps {
    selectedCustomer: Customer | null;
    customers: Customer[];
    customerSearch: string;
    showDropdown: boolean;
    onSearchChange: (search: string) => void;
    onSelect: (customer: Customer) => void;
    onClear: () => void;
    onAddNew: () => void;
    onDropdownToggle: (show: boolean) => void;
}

/**
 * Customer selector dropdown component
 */
export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
    selectedCustomer,
    customers,
    customerSearch,
    showDropdown,
    onSearchChange,
    onSelect,
    onClear,
    onAddNew,
    onDropdownToggle,
}) => {
    return (
        <div className="relative customer-dropdown-container">
            {/* Selected Customer Display or Search Input */}
            {selectedCustomer ? (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3">
                    <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {selectedCustomer.name}
                        </p>
                        {selectedCustomer.phone && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {selectedCustomer.phone}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClear}
                        className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => {
                                onSearchChange(e.target.value);
                                onDropdownToggle(true);
                            }}
                            onFocus={() => onDropdownToggle(true)}
                            placeholder="Tìm khách hàng (tên, SĐT)..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={onAddNew}
                        className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-semibold whitespace-nowrap"
                        title="Thêm khách hàng mới"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span className="hidden sm:inline">Thêm</span>
                    </button>
                </div>
            )}

            {/* Dropdown */}
            {showDropdown && !selectedCustomer && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {/* Add New Button */}
                    <button
                        onClick={() => {
                            onAddNew();
                            onDropdownToggle(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-slate-200 dark:border-slate-700"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span className="font-medium">Thêm khách hàng mới</span>
                    </button>

                    {/* Customer List */}
                    {customers.length > 0 ? (
                        customers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => {
                                    onSelect(customer);
                                    onSearchChange(customer.name);
                                    onDropdownToggle(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                            >
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {customer.name}
                                </p>
                                {customer.phone && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {customer.phone}
                                    </p>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            Không tìm thấy khách hàng
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
