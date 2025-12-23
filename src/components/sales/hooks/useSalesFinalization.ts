/**
 * Custom hook for managing sales finalization (checkout process)
 * 
 * This hook handles:
 * - Payment method selection
 * - Payment type (full/partial/note)
 * - Custom sale time
 * - Order notes
 * - Delivery information (COD)
 * - Sale finalization logic
 */

import { useState } from "react";

export interface UseSalesFinalizationReturn {
    // Payment state
    paymentMethod: "cash" | "bank" | null;
    paymentType: "full" | "partial" | "note" | null;
    partialAmount: number;
    autoPrintReceipt: boolean;
    useCurrentTime: boolean;
    customSaleTime: string;
    showOrderNote: boolean;
    orderNote: string;

    // Delivery state (COD)
    deliveryMethod: "store_pickup" | "cod" | null;
    deliveryAddress: string;
    deliveryPhone: string;
    deliveryNotes: string;
    shipperId: string;
    codAmount: number;
    shippingFee: number;
    trackingNumber: string;
    estimatedDeliveryDate: string;

    // Actions
    setPaymentMethod: (method: "cash" | "bank" | null) => void;
    setPaymentType: (type: "full" | "partial" | "note" | null) => void;
    setPartialAmount: (amount: number) => void;
    setAutoPrintReceipt: (auto: boolean) => void;
    setUseCurrentTime: (use: boolean) => void;
    setCustomSaleTime: (time: string) => void;
    setShowOrderNote: (show: boolean) => void;
    setOrderNote: (note: string) => void;

    // Delivery actions
    setDeliveryMethod: (method: "store_pickup" | "cod" | null) => void;
    setDeliveryAddress: (address: string) => void;
    setDeliveryPhone: (phone: string) => void;
    setDeliveryNotes: (notes: string) => void;
    setShipperId: (id: string) => void;
    setCodAmount: (amount: number) => void;
    setShippingFee: (fee: number) => void;
    setTrackingNumber: (number: string) => void;
    setEstimatedDeliveryDate: (date: string) => void;

    // Reset
    resetFinalizationState: () => void;
}

/**
 * Custom hook for sales finalization
 */
export function useSalesFinalization(): UseSalesFinalizationReturn {
    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | null>(null);
    const [paymentType, setPaymentType] = useState<"full" | "partial" | "note" | null>(null);
    const [partialAmount, setPartialAmount] = useState(0);
    const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
    const [useCurrentTime, setUseCurrentTime] = useState(true);
    const [customSaleTime, setCustomSaleTime] = useState("");
    const [showOrderNote, setShowOrderNote] = useState(false);
    const [orderNote, setOrderNote] = useState("");

    // Delivery state (COD)
    const [deliveryMethod, setDeliveryMethod] = useState<"store_pickup" | "cod" | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryPhone, setDeliveryPhone] = useState("");
    const [deliveryNotes, setDeliveryNotes] = useState("");
    const [shipperId, setShipperId] = useState("");
    const [codAmount, setCodAmount] = useState(0);
    const [shippingFee, setShippingFee] = useState(0);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

    // Reset all finalization state
    const resetFinalizationState = () => {
        setPaymentMethod(null);
        setPaymentType(null);
        setPartialAmount(0);
        setCustomSaleTime("");
        setOrderNote("");
        setShowOrderNote(false);

        setDeliveryMethod(null);
        setDeliveryAddress("");
        setDeliveryPhone("");
        setDeliveryNotes("");
        setShipperId("");
        setCodAmount(0);
        setShippingFee(0);
        setTrackingNumber("");
        setEstimatedDeliveryDate("");
    };

    return {
        // Payment state
        paymentMethod,
        paymentType,
        partialAmount,
        autoPrintReceipt,
        useCurrentTime,
        customSaleTime,
        showOrderNote,
        orderNote,

        // Delivery state
        deliveryMethod,
        deliveryAddress,
        deliveryPhone,
        deliveryNotes,
        shipperId,
        codAmount,
        shippingFee,
        trackingNumber,
        estimatedDeliveryDate,

        // Actions
        setPaymentMethod,
        setPaymentType,
        setPartialAmount,
        setAutoPrintReceipt,
        setUseCurrentTime,
        setCustomSaleTime,
        setShowOrderNote,
        setOrderNote,

        // Delivery actions
        setDeliveryMethod,
        setDeliveryAddress,
        setDeliveryPhone,
        setDeliveryNotes,
        setShipperId,
        setCodAmount,
        setShippingFee,
        setTrackingNumber,
        setEstimatedDeliveryDate,

        // Reset
        resetFinalizationState,
    };
}
