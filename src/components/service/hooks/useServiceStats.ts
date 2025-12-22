/**
 * Custom hook for calculating service statistics
 * Extracted from ServiceManager.tsx for reusability and better separation of concerns
 */

import { useMemo } from "react";
import type { WorkOrder, WorkOrderPart } from "../../../types";
import type { ServiceStats } from "../types/service.types";

interface UseServiceStatsOptions {
    workOrders: WorkOrder[];
    dateFilter: "all" | "today" | "week" | "month";
}

interface UseServiceStatsReturn {
    stats: ServiceStats;
    dateFilteredOrders: WorkOrder[];
    totalOpenTickets: number;
    urgentTickets: number;
    urgentRatio: number;
    completionRate: number;
    profitMargin: number;
}

/**
 * Hook to calculate service statistics from work orders
 * 
 * @param options - Work orders and date filter settings
 * @returns Calculated statistics and derived metrics
 * 
 * @example
 * const { stats, profitMargin } = useServiceStats({
 *   workOrders: displayWorkOrders,
 *   dateFilter: "week"
 * });
 */
export function useServiceStats({
    workOrders,
    dateFilter
}: UseServiceStatsOptions): UseServiceStatsReturn {

    // Filter orders by date
    const dateFilteredOrders = useMemo(() => {
        let filtered = [...workOrders];

        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter((o) => {
                const orderDate = new Date(o.creationDate || (o as any).creationdate);

                if (dateFilter === "today") {
                    return orderDate >= today;
                } else if (dateFilter === "week") {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return orderDate >= weekAgo;
                } else if (dateFilter === "month") {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return orderDate >= monthAgo;
                }
                return true;
            });
        }

        return filtered;
    }, [workOrders, dateFilter]);

    // Calculate stats
    const stats = useMemo((): ServiceStats => {
        const pending = dateFilteredOrders.filter(
            (o) => o.status === "Tiếp nhận"
        ).length;

        const inProgress = dateFilteredOrders.filter(
            (o) => o.status === "Đang sửa"
        ).length;

        const done = dateFilteredOrders.filter(
            (o) => o.status === "Đã sửa xong"
        ).length;

        const delivered = dateFilteredOrders.filter(
            (o) => o.status === "Trả máy"
        ).length;

        // Calculate revenue from paid orders
        const filteredRevenue = dateFilteredOrders
            .filter((o) => o.paymentStatus === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        // Calculate profit = Revenue - Cost (parts + services)
        const filteredProfit = dateFilteredOrders
            .filter((o) => o.paymentStatus === "paid")
            .reduce((sum, o) => {
                // Parts cost
                const partsCost = o.partsUsed?.reduce(
                    (s: number, p: WorkOrderPart) =>
                        s + (p.costPrice || 0) * (p.quantity || 1),
                    0
                ) || 0;

                // Services cost
                const servicesCost = o.additionalServices?.reduce(
                    (s: number, svc: { costPrice?: number; quantity?: number }) =>
                        s + (svc.costPrice || 0) * (svc.quantity || 1),
                    0
                ) || 0;

                return sum + (o.total - partsCost - servicesCost);
            }, 0);

        return {
            pending,
            inProgress,
            done,
            delivered,
            filteredRevenue,
            filteredProfit,
        };
    }, [dateFilteredOrders]);

    // Calculate derived metrics
    const totalOpenTickets = stats.pending + stats.inProgress + stats.done;
    const urgentTickets = stats.pending + stats.inProgress;
    const urgentRatio = totalOpenTickets
        ? Math.round((urgentTickets / totalOpenTickets) * 100)
        : 0;
    const completionRate = totalOpenTickets
        ? Math.round((stats.done / totalOpenTickets) * 100)
        : 0;
    const profitMargin = stats.filteredRevenue
        ? Math.round((stats.filteredProfit / stats.filteredRevenue) * 100)
        : 0;

    return {
        stats,
        dateFilteredOrders,
        totalOpenTickets,
        urgentTickets,
        urgentRatio,
        completionRate,
        profitMargin,
    };
}
