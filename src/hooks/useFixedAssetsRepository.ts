import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FixedAsset } from "../types";
import {
  fetchFixedAssets,
  createFixedAsset,
  updateFixedAsset,
  deleteFixedAsset,
} from "../lib/repository/fixedAssetsRepository";
import { useAppContext } from "../contexts/AppContext";

// ========== FIXED ASSETS HOOKS ==========

export function useFixedAssetsRepo() {
  const { currentBranchId } = useAppContext();

  return useQuery({
    queryKey: ["fixed-assets", currentBranchId],
    queryFn: async () => {
      const result = await fetchFixedAssets();
      if (!result.ok) throw new Error(result.error.message);
      // Filter by branch
      return result.data.filter(
        (a: FixedAsset) => a.branchId === currentBranchId
      );
    },
    staleTime: 30_000,
  });
}

export function useCreateFixedAssetRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async (asset: Omit<FixedAsset, "id" | "created_at">) => {
      const result = await createFixedAsset(asset);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets", currentBranchId],
      });
    },
  });
}

export function useUpdateFixedAssetRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FixedAsset>;
    }) => {
      const result = await updateFixedAsset(id, updates);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets", currentBranchId],
      });
    },
  });
}

export function useDeleteFixedAssetRepo() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useAppContext();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFixedAsset(id);
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets", currentBranchId],
      });
    },
  });
}
