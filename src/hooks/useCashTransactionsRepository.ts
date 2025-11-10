import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCashTransactions,
  createCashTransaction,
  type CreateCashTxInput,
} from "../lib/repository/cashTransactionsRepository";
import { showToast } from "../utils/toast";
import { mapRepoErrorForUser } from "../utils/errorMapping";

export const useCashTxRepo = (params?: {
  branchId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
}) => {
  return useQuery({
    queryKey: ["cashTxRepo", params],
    queryFn: async () => {
      const res = await fetchCashTransactions(params);
      if (!res.ok) throw res.error;
      return res.data;
    },
  });
};

export const useCreateCashTxRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashTxInput) => createCashTransaction(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashTxRepo"] });
      showToast.success("Đã ghi thu/chi");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};
