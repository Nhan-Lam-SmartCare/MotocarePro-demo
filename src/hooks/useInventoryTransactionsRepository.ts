import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventoryTransactions,
  createInventoryTransaction,
  type CreateInventoryTxInput,
} from "../lib/repository/inventoryTransactionsRepository";
import { showToast } from "../utils/toast";
import { mapRepoErrorForUser } from "../utils/errorMapping";

export const useInventoryTxRepo = (params?: {
  branchId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["inventoryTxRepo", params],
    queryFn: async () => {
      const res = await fetchInventoryTransactions(params);
      if (!res.ok) throw res.error;
      return res.data;
    },
  });
};

export const useCreateInventoryTxRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInventoryTxInput) =>
      createInventoryTransaction(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventoryTxRepo"] });
      showToast.success("Đã ghi lịch sử kho");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};
