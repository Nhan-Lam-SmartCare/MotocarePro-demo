import { supabase } from "../../supabaseClient";
import type { Part } from "../../types";
import { RepoResult, success, failure } from "./types";

// Centralized table name constant
const PARTS_TABLE = "parts";

// Fetch all parts
export async function fetchParts(): Promise<RepoResult<Part[]>> {
  try {
    const { data, error } = await supabase
      .from(PARTS_TABLE)
      .select("*")
      .order("name");
    if (error)
      return failure({
        code: "supabase",
        message: "Không thể tải danh sách phụ tùng",
        cause: error,
      });
    return success(data || []);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối tới máy chủ",
      cause: e,
    });
  }
}

// Create a part
export async function createPart(
  input: Partial<Part>
): Promise<RepoResult<Part>> {
  try {
    if (!input.name)
      return failure({ code: "validation", message: "Thiếu tên phụ tùng" });
    const payload: any = {
      name: input.name,
      sku: input.sku || `SKU-${Date.now()}`,
      stock: input.stock || { CN1: 0 },
      retailPrice: input.retailPrice || { CN1: 0 },
      wholesalePrice: input.wholesalePrice || { CN1: 0 },
      category: input.category,
      description: input.description,
      warrantyPeriod: input.warrantyPeriod,
      costPrice: input.costPrice || { CN1: 0 },
      vatRate: input.vatRate ?? 0.1,
    };
    const { data, error } = await supabase
      .from(PARTS_TABLE)
      .insert([payload])
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Tạo phụ tùng thất bại",
        cause: error,
      });
    return success(data as Part);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tạo phụ tùng",
      cause: e,
    });
  }
}

// Update a part by id
export async function updatePart(
  id: string,
  updates: Partial<Part>
): Promise<RepoResult<Part>> {
  try {
    const { data, error } = await supabase
      .from(PARTS_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Cập nhật phụ tùng thất bại",
        cause: error,
      });
    return success(data as Part);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi cập nhật phụ tùng",
      cause: e,
    });
  }
}

// Batch rename category using one SQL update
export async function renameCategory(
  oldName: string,
  newName: string
): Promise<RepoResult<{ updated: number }>> {
  try {
    if (!newName.trim())
      return failure({
        code: "validation",
        message: "Tên danh mục mới không hợp lệ",
      });
    const { error, data } = await supabase
      .from(PARTS_TABLE)
      .update({ category: newName })
      .eq("category", oldName)
      .select("id");

    if (error)
      return failure({
        code: "supabase",
        message: "Đổi tên danh mục thất bại",
        cause: error,
      });
    return success({ updated: (data as any[] | null)?.length || 0 });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi đổi tên danh mục",
      cause: e,
    });
  }
}

// Delete category = set category NULL on affected parts
export async function deleteCategory(
  name: string
): Promise<RepoResult<{ updated: number }>> {
  try {
    const { error, data } = await supabase
      .from(PARTS_TABLE)
      .update({ category: null })
      .eq("category", name)
      .select("id");
    if (error)
      return failure({
        code: "supabase",
        message: "Xóa danh mục thất bại",
        cause: error,
      });
    return success({ updated: (data as any[] | null)?.length || 0 });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa danh mục",
      cause: e,
    });
  }
}

// Delete a part by id
export async function deletePartById(
  id: string
): Promise<RepoResult<{ id: string }>> {
  try {
    const { error } = await supabase.from(PARTS_TABLE).delete().eq("id", id);
    if (error)
      return failure({
        code: "supabase",
        message: "Xóa phụ tùng thất bại",
        cause: error,
      });
    return success({ id });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa phụ tùng",
      cause: e,
    });
  }
}
