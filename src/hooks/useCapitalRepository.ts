import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Capital } from "../types";
import {
  fetchCapitals,
  createCapital,
  updateCapital,
  deleteCapital,
} from "../lib/repository/capitalRepository";
import { useAppContext } from "../contexts/AppContext";

// ========== CAPITAL HOOKS ==========

export function useCapitalRepo() {
  const { currentBranchId } = useAppContext();

  return useQuery({
    queryKey: ["capitals", currentBranchId],
    queryFn: async () => {
      const result = await fetchCapitals();
      if (!result.ok) throw new Error(result.error.message);
      // Filter by branch
      return result.data.filter((c) => c.branchId === currentBranchId);
    },
    staleTime: 30_000,
  });
}

export function useCreateCapitalRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async (capital: Omit<Capital, "id" | "created_at">) => {
      const result = await createCapital(capital);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["capitals", currentBranchId],
      });
    },
  });
}

export function useUpdateCapitalRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Capital>;
    }) => {
      const result = await updateCapital(id, updates);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["capitals", currentBranchId],
      });
    },
  });
}

export function useDeleteCapitalRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCapital(id);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["capitals", currentBranchId],
      });
    },
  });
}
