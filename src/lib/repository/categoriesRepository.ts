import { supabase } from "../../supabaseClient";
import type { Category } from "../../types";
import { RepoResult, success, failure } from "./types";

const CATEGORIES_TABLE = "categories";

export async function fetchCategories(): Promise<RepoResult<Category[]>> {
  try {
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .select("*")
      .order("name");
    if (error)
      return failure({
        code: "supabase",
        message: "Không thể tải danh mục",
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

export async function createCategory(
  input: Partial<Category>
): Promise<RepoResult<Category>> {
  try {
    if (!input.name)
      return failure({ code: "validation", message: "Thiếu tên danh mục" });
    const payload: any = {
      name: input.name,
      icon: input.icon,
      color: input.color,
    };
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .insert([payload])
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Tạo danh mục thất bại",
        cause: error,
      });
    return success(data as Category);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tạo danh mục",
      cause: e,
    });
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<RepoResult<Category>> {
  try {
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Cập nhật danh mục thất bại",
        cause: error,
      });
    return success(data as Category);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi cập nhật danh mục",
      cause: e,
    });
  }
}

export async function deleteCategoryRecord(
  id: string
): Promise<RepoResult<{ id: string }>> {
  try {
    const { error } = await supabase
      .from(CATEGORIES_TABLE)
      .delete()
      .eq("id", id);
    if (error)
      return failure({
        code: "supabase",
        message: "Xóa danh mục thất bại",
        cause: error,
      });
    return success({ id });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa danh mục",
      cause: e,
    });
  }
}
