import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSales,
  createSale,
  deleteSaleById,
} from "../lib/repository/salesRepository";
import type { Sale } from "../types";
import { showToast } from "../utils/toast";
import { mapRepoErrorForUser } from "../utils/errorMapping";

export const useSalesRepo = () => {
  return useQuery({
    queryKey: ["salesRepo"],
    queryFn: async () => {
      const res = await fetchSales();
      if (!res.ok) throw res.error;
      return res.data;
    },
  });
};

export const useCreateSaleRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Sale>) => createSale(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesRepo"] });
      showToast.success("Đã tạo hóa đơn");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};

export const useDeleteSaleRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteSaleById(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesRepo"] });
      showToast.success("Đã xóa hóa đơn");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};
