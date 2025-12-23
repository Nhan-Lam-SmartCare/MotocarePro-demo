import React from "react";
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";

export type DeliveryStatus = "pending" | "preparing" | "shipping" | "delivered" | "cancelled";

interface DeliveryStatusBadgeProps {
    status?: DeliveryStatus;
    className?: string;
}

const statusConfig: Record<DeliveryStatus, {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ReactNode;
}> = {
    pending: {
        label: "Chờ xử lý",
        bgClass: "bg-yellow-50 dark:bg-yellow-900/20",
        textClass: "text-yellow-700 dark:text-yellow-400",
        borderClass: "border-yellow-200 dark:border-yellow-700",
        icon: <Clock className="w-3.5 h-3.5" />,
    },
    preparing: {
        label: "Đang chuẩn bị",
        bgClass: "bg-orange-50 dark:bg-orange-900/20",
        textClass: "text-orange-700 dark:text-orange-400",
        borderClass: "border-orange-200 dark:border-orange-700",
        icon: <Package className="w-3.5 h-3.5" />,
    },
    shipping: {
        label: "Đang giao",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        textClass: "text-blue-700 dark:text-blue-400",
        borderClass: "border-blue-200 dark:border-blue-700",
        icon: <Truck className="w-3.5 h-3.5" />,
    },
    delivered: {
        label: "Đã giao",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        textClass: "text-green-700 dark:text-green-400",
        borderClass: "border-green-200 dark:border-green-700",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    cancelled: {
        label: "Đã hủy",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        textClass: "text-red-700 dark:text-red-400",
        borderClass: "border-red-200 dark:border-red-700",
        icon: <XCircle className="w-3.5 h-3.5" />,
    },
};

export const DeliveryStatusBadge: React.FC<DeliveryStatusBadgeProps> = ({
    status,
    className = ""
}) => {
    if (!status) return null;

    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
};

// Delivery Method Badge
interface DeliveryMethodBadgeProps {
    method?: "pickup" | "delivery";
    className?: string;
}

export const DeliveryMethodBadge: React.FC<DeliveryMethodBadgeProps> = ({
    method = "pickup",
    className = ""
}) => {
    const isDelivery = method === "delivery";

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isDelivery
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                } ${className}`}
        >
            {isDelivery ? "🚚 Giao hàng" : "🏪 Tự lấy"}
        </span>
    );
};
