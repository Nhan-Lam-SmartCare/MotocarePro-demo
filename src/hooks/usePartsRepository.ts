import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchParts,
  createPart,
  updatePart,
  deletePartById,
} from "../lib/repository/partsRepository";
import type { Part } from "../types";
import { showToast } from "../utils/toast";
import { mapRepoErrorForUser } from "../utils/errorMapping";

export const usePartsRepo = () => {
  return useQuery({
    queryKey: ["partsRepo"],
    queryFn: async () => {
      const res = await fetchParts();
      if (!res.ok) throw res.error;
      return res.data;
    },
  });
};

export const useCreatePartRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPart,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partsRepo"] });
      showToast.success("Đã tạo phụ tùng");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};

export const useUpdatePartRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Part> }) =>
      updatePart(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partsRepo"] });
      showToast.success("Đã cập nhật phụ tùng");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};

export const useDeletePartRepo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deletePartById(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partsRepo"] });
      showToast.success("Đã xóa phụ tùng");
    },
    onError: (err: any) => showToast.error(mapRepoErrorForUser(err)),
  });
};
