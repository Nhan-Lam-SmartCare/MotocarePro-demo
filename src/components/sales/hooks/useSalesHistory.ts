/**
 * Custom hook for managing sales history with server-side pagination
 * 
 * This hook handles:
 * - Sales list fetching with filters
 * - Pagination (offset and keyset modes)
 * - Sales CRUD operations (edit, update, delete)
 */

import { useState, useEffect, useCallback } from "react";

export interface UseSalesPagedParams {
    branchId: string;
    page?: number;
    pageSize: number;
    search?: string;
    fromDate?: string;
    toDate?: string;
    mode: "offset" | "keyset";
    afterDate?: string;
    afterId?: string;
    status?: "completed" | "refunded";
    paymentMethod?: "cash" | "bank";
}

export interface UseSalesHistoryReturn {
    // Pagination state
    salesPage: number;
    salesPageSize: number;
    salesSearchInput: string;
    salesSearch: string;
    salesFromDate: string | undefined;
    salesToDate: string | undefined;
    salesStatus: "all" | "completed" | "cancelled" | "refunded";
    salesPaymentMethod: "all" | "cash" | "bank";
    useKeysetMode: boolean;
    keysetCursor: { afterDate?: string; afterId?: string } | null;

    // Actions
    setSalesPage: (page: number | ((prev: number) => number)) => void;
    setSalesPageSize: (size: number) => void;
    setSalesSearchInput: (search: string) => void;
    setSalesSearch: (search: string) => void;
    setSalesFromDate: (date: string | undefined) => void;
    setSalesToDate: (date: string | undefined) => void;
    setSalesStatus: (status: "all" | "completed" | "cancelled" | "refunded") => void;
    setSalesPaymentMethod: (method: "all" | "cash" | "bank") => void;
    setUseKeysetMode: (use: boolean) => void;
    setKeysetCursor: (cursor: { afterDate?: string; afterId?: string } | null) => void;
    goPrevPage: () => void;
    goNextPage: () => void;
    changePageSize: (size: number) => void;

    // Modal state
    showSalesHistory: boolean;
    setShowSalesHistory: (show: boolean) => void;
    selectedSaleDetail: any | null;
    setSelectedSaleDetail: (sale: any | null) => void;
    showSaleDetailModal: boolean;
    setShowSaleDetailModal: (show: boolean) => void;
}

/**
 * Custom hook for sales history management
 */
export function useSalesHistory(): UseSalesHistoryReturn {
    // Server-side pagination parameters
    const [salesPage, setSalesPage] = useState(1);
    const [salesPageSize, setSalesPageSize] = useState(20);
    const [salesSearchInput, setSalesSearchInput] = useState("");
    const [salesSearch, setSalesSearch] = useState("");
    const [salesFromDate, setSalesFromDate] = useState<string | undefined>();
    const [salesToDate, setSalesToDate] = useState<string | undefined>();
    const [salesStatus, setSalesStatus] = useState<
        "all" | "completed" | "cancelled" | "refunded"
    >("all");
    const [salesPaymentMethod, setSalesPaymentMethod] = useState<
        "all" | "cash" | "bank"
    >("all");
    const [useKeysetMode, setUseKeysetMode] = useState(false);
    const [keysetCursor, setKeysetCursor] = useState<{
        afterDate?: string;
        afterId?: string;
    } | null>(null);

    // Modal state
    const [showSalesHistory, setShowSalesHistory] = useState(false);
    const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
    const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);

    // Pagination handlers
    const goPrevPage = useCallback(
        () => setSalesPage((p) => Math.max(1, p - 1)),
        []
    );
    const goNextPage = useCallback(() => setSalesPage((p) => p + 1), []);
    const changePageSize = useCallback((sz: number) => {
        setSalesPageSize(sz);
        setSalesPage(1);
        setKeysetCursor(null);
    }, []);

    // Debounce search (300ms)
    useEffect(() => {
        const h = setTimeout(() => {
            setSalesSearch(salesSearchInput);
            setSalesPage(1);
        }, 300);
        return () => clearTimeout(h);
    }, [salesSearchInput]);

    return {
        // Pagination state
        salesPage,
        salesPageSize,
        salesSearchInput,
        salesSearch,
        salesFromDate,
        salesToDate,
        salesStatus,
        salesPaymentMethod,
        useKeysetMode,
        keysetCursor,

        // Actions
        setSalesPage,
        setSalesPageSize,
        setSalesSearchInput,
        setSalesSearch,
        setSalesFromDate,
        setSalesToDate,
        setSalesStatus,
        setSalesPaymentMethod,
        setUseKeysetMode,
        setKeysetCursor,
        goPrevPage,
        goNextPage,
        changePageSize,

        // Modal state
        showSalesHistory,
        setShowSalesHistory,
        selectedSaleDetail,
        setSelectedSaleDetail,
        showSaleDetailModal,
        setShowSaleDetailModal,
    };
}
