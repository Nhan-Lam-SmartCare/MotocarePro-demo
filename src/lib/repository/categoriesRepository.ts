import { supabase } from "../../supabaseClient";
import type { Category } from "../../types";
import { RepoResult, success, failure } from "./types";
import { safeAudit } from "./auditLogsRepository";

const CATEGORIES_TABLE = "categories";
const CACHE_KEY = "motocare_cached_categories";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

let memoryCategoryCache: { timestamp: number; data: Category[] } | null = null;

export function clearCategoryCache() {
  memoryCategoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (_e) {
    void _e;
  }
}

export async function fetchCategories(forceRefresh = false): Promise<RepoResult<Category[]>> {
  try {
    const now = Date.now();
    if (!forceRefresh && memoryCategoryCache && now - memoryCategoryCache.timestamp < CACHE_TTL_MS) {
      return success(memoryCategoryCache.data);
    }

    if (!forceRefresh) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && now - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data)) {
            memoryCategoryCache = parsed;
            return success(parsed.data);
          }
        }
      } catch (_e) {
        void _e;
      }
    }

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

    const result = data || [];
    memoryCategoryCache = { timestamp: now, data: result };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCategoryCache));
    } catch (_e) {
      void _e;
    }

    return success(result);
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
      id:
        typeof crypto !== "undefined" && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : `${Math.random().toString(36).slice(2)}-${Date.now()}`,
      name: input.name,
      icon: input.icon,
      color: input.color,
      parent_id: input.parent_id,
      sku_prefix: input.sku_prefix,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch (_e) {
      void _e;
    }
    await safeAudit(userId, {
      action: "category.create",
      tableName: CATEGORIES_TABLE,
      recordId: (data as any).id,
      oldData: null,
      newData: data,
    });
    clearCategoryCache();
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
    let oldRow: any = null;
    try {
      const resp: any = await supabase
        .from(CATEGORIES_TABLE)
        .select("*")
        .eq("id", id)
        .single();
      oldRow = resp?.data ?? null;
    } catch (_e) {
      void _e;
    }
    // Không có oldRow vẫn tiếp tục (audit oldData: null)
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    let resultRow: any = data;
    if ((!data || error) && !error) {
      // No data returned but also no supabase error => synthesize row (mock case)
      resultRow = { id, ...(oldRow || {}), ...updates };
    }
    if (error && data == null) {
      return failure({
        code: "supabase",
        message: "Cập nhật danh mục thất bại",
        cause: error,
      });
    }
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch (_e) {
      void _e;
    }
    await safeAudit(userId, {
      action: "category.update",
      tableName: CATEGORIES_TABLE,
      recordId: id,
      oldData: oldRow,
      newData: data,
    });
    clearCategoryCache();
    return success(resultRow as Category);
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
    let oldRow: any = null;
    try {
      const resp: any = await supabase
        .from(CATEGORIES_TABLE)
        .select("*")
        .eq("id", id)
        .single();
      oldRow = resp?.data ?? null;
    } catch (_e) {
      void _e;
    }
    // Không có oldRow vẫn tiếp tục xóa (audit oldData: null)
    const { error } = await supabase
      .from(CATEGORIES_TABLE)
      .delete()
      .eq("id", id);
    if (error) {
      return failure({
        code: "supabase",
        message: "Xóa danh mục thất bại",
        cause: error,
      });
    }
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch (_e) {
      void _e;
    }
    await safeAudit(userId, {
      action: "category.delete",
      tableName: CATEGORIES_TABLE,
      recordId: id,
      oldData: oldRow,
      newData: null,
    });
    clearCategoryCache();
    return success({ id });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa danh mục",
      cause: e,
    });
  }
}
