import { useState, useCallback, useMemo } from "react";
import type { CartItem, Part } from "../../../types";
import { showToast } from "../../../utils/toast";

export interface UseSalesCartReturn {
    // State
    cartItems: CartItem[];
    orderDiscount: number;
    discountType: "amount" | "percent";
    discountPercent: number;

    // Actions
    addToCart: (part: Part, branchId: string) => void;
    removeFromCart: (partId: string) => void;
    updateCartQuantity: (partId: string, quantity: number) => void;
    updateCartPrice: (partId: string, newPrice: number) => void;
    setOrderDiscount: (discount: number) => void;
    setDiscountType: (type: "amount" | "percent") => void;
    setDiscountPercent: (percent: number) => void;
    clearCart: () => void;
    setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;

    // Computed
    subtotal: number;
    total: number;
    cartItemById: Map<string, CartItem>;
}

/**
 * Custom hook for managing sales cart operations
 */
export function useSalesCart(
    initialCartItems: CartItem[],
    setGlobalCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>,
    clearGlobalCart: () => void
): UseSalesCartReturn {
    const [orderDiscount, setOrderDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<"amount" | "percent">(
        "amount"
    );
    const [discountPercent, setDiscountPercent] = useState(0);

    // Cart operations
    const addToCart = useCallback(
        (part: Part, branchId: string) => {
            const price = part.retailPrice?.[branchId] ?? 0;
            const stock = part.stock?.[branchId] ?? 0;
            const existing = initialCartItems.find((item) => item.partId === part.id);

            if (existing) {
                // Validate stock before adding more
                const newQuantity = existing.quantity + 1;
                if (newQuantity > stock) {
                    showToast.error(`Không đủ hàng! Tồn kho: ${stock}`);
                    return;
                }
                setGlobalCartItems((prev) =>
                    prev.map((item) =>
                        item.partId === part.id ? { ...item, quantity: newQuantity } : item
                    )
                );
            } else {
                // Check if stock available
                if (stock < 1) {
                    showToast.error("Sản phẩm đã hết hàng!");
                    return;
                }
                const newItem: CartItem = {
                    partId: part.id,
                    partName: part.name,
                    sku: part.sku,
                    quantity: 1,
                    sellingPrice: price,
                    stockSnapshot: stock,
                    discount: 0,
                };
                setGlobalCartItems((prev) => [...prev, newItem]);
            }
        },
        [initialCartItems, setGlobalCartItems]
    );

    const removeFromCart = useCallback(
        (partId: string) => {
            setGlobalCartItems((prev) => prev.filter((item) => item.partId !== partId));
        },
        [setGlobalCartItems]
    );

    const updateCartQuantity = useCallback(
        (partId: string, quantity: number) => {
            if (quantity <= 0) {
                removeFromCart(partId);
                return;
            }

            // Validate against stock
            const item = initialCartItems.find((i) => i.partId === partId);
            if (item && quantity > item.stockSnapshot) {
                showToast.error(`Không đủ hàng! Tồn kho: ${item.stockSnapshot}`);
                return;
            }

            setGlobalCartItems((prev) =>
                prev.map((item) =>
                    item.partId === partId ? { ...item, quantity } : item
                )
            );
        },
        [initialCartItems, setGlobalCartItems, removeFromCart]
    );

    const updateCartPrice = useCallback(
        (partId: string, newPrice: number) => {
            if (newPrice < 0) {
                showToast.error("Giá không được âm!");
                return;
            }
            setGlobalCartItems((prev) =>
                prev.map((item) =>
                    item.partId === partId ? { ...item, sellingPrice: newPrice } : item
                )
            );
        },
        [setGlobalCartItems]
    );

    // Calculate totals
    const subtotal = useMemo(
        () =>
            initialCartItems.reduce(
                (sum, item) => sum + item.sellingPrice * item.quantity,
                0
            ),
        [initialCartItems]
    );

    const total = useMemo(
        () => Math.max(0, subtotal - orderDiscount),
        [subtotal, orderDiscount]
    );

    const cartItemById = useMemo(() => {
        const map = new Map<string, CartItem>();
        initialCartItems.forEach((item) => map.set(item.partId, item));
        return map;
    }, [initialCartItems]);

    return {
        // State
        cartItems: initialCartItems,
        orderDiscount,
        discountType,
        discountPercent,

        // Actions
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartPrice,
        setOrderDiscount,
        setDiscountType,
        setDiscountPercent,
        clearCart: clearGlobalCart,
        setCartItems: setGlobalCartItems,

        // Computed
        subtotal,
        total,
        cartItemById,
    };
}
