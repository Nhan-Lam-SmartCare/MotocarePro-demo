import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

export const useWorkOrdersRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const channel = supabase
      .channel("work-orders-realtime-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
        },
        (payload: any) => {
          console.warn("[Realtime] Work orders changed:", payload.eventType);

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["workOrdersRepo"] });
            queryClient.invalidateQueries({ queryKey: ["workOrdersFiltered"] });
            queryClient.invalidateQueries({ queryKey: ["unpaidWorkOrders"] });
            queryClient.invalidateQueries({ queryKey: ["partsRepo"] });
            queryClient.invalidateQueries({ queryKey: ["partsRepoPaged"] });
            queryClient.invalidateQueries({ queryKey: ["inventoryTxRepo"] });
            queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
            queryClient.invalidateQueries({ queryKey: ["paymentSources"] });
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
