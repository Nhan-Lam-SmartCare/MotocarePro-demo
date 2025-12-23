import { useState, useMemo, useCallback } from "react";
import type { Customer } from "../../../types";
import { showToast } from "../../../utils/toast";

export interface NewCustomerData {
    name: string;
    phone: string;
    vehicleModel: string;
    licensePlate: string;
}

export interface UseCustomerSelectionReturn {
    // State
    selectedCustomer: Customer | null;
    customerSearch: string;
    showCustomerDropdown: boolean;
    showAddCustomerModal: boolean;
    newCustomer: NewCustomerData;

    // Actions
    setSelectedCustomer: (customer: Customer | null) => void;
    setCustomerSearch: (search: string) => void;
    setShowCustomerDropdown: (show: boolean) => void;
    setShowAddCustomerModal: (show: boolean) => void;
    setNewCustomer: React.Dispatch<React.SetStateAction<NewCustomerData>>;
    handleSaveNewCustomer: (
        customers: Customer[],
        createCustomerMutation: any
    ) => void;

    // Computed
    filteredCustomers: Customer[];
}

/**
 * Custom hook for managing customer selection and creation
 */
export function useCustomerSelection(
    allCustomers: Customer[]
): UseCustomerSelectionReturn {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null
    );
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
        name: "",
        phone: "",
        vehicleModel: "",
        licensePlate: "",
    });

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return allCustomers;
        const search = customerSearch.toLowerCase();
        return allCustomers.filter(
            (c) =>
                c.name?.toLowerCase().includes(search) ||
                c.phone?.includes(search)
        );
    }, [allCustomers, customerSearch]);

    // Handle save new customer
    const handleSaveNewCustomer = useCallback(
        (customers: Customer[], createCustomerMutation: any) => {
            if (!newCustomer.name || !newCustomer.phone) {
                alert("Vui lòng nhập tên và số điện thoại");
                return;
            }

            // Check if customer already exists
            const existingCustomer = customers.find(
                (c) => c.phone === newCustomer.phone
            );
            if (existingCustomer) {
                alert("Số điện thoại này đã tồn tại!");
                return;
            }

            // Create new customer
            const customer = {
                id: `CUST-${Date.now()}`,
                name: newCustomer.name,
                phone: newCustomer.phone,
                created_at: new Date().toISOString(),
                vehicleModel: newCustomer.vehicleModel,
                licensePlate: newCustomer.licensePlate,
            };

            // Save to database using mutation
            createCustomerMutation.mutate(customer, {
                onSuccess: (savedCustomer: Customer) => {
                    // Select the new customer
                    setSelectedCustomer({
                        id: savedCustomer.id,
                        name: savedCustomer.name,
                        phone: savedCustomer.phone,
                        created_at: savedCustomer.created_at,
                    });
                    setCustomerSearch(savedCustomer.name);

                    // Reset form and close modal
                    setNewCustomer({
                        name: "",
                        phone: "",
                        vehicleModel: "",
                        licensePlate: "",
                    });
                    setShowAddCustomerModal(false);
                    showToast.success("Đã thêm khách hàng mới!");
                },
                onError: (error: any) => {
                    console.error("Error creating customer:", error);
                    showToast.error("Không thể thêm khách hàng. Vui lòng thử lại.");
                },
            });
        },
        [newCustomer]
    );

    return {
        // State
        selectedCustomer,
        customerSearch,
        showCustomerDropdown,
        showAddCustomerModal,
        newCustomer,

        // Actions
        setSelectedCustomer,
        setCustomerSearch,
        setShowCustomerDropdown,
        setShowAddCustomerModal,
        setNewCustomer,
        handleSaveNewCustomer,

        // Computed
        filteredCustomers,
    };
}
