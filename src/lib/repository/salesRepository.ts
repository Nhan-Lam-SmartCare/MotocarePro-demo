import { supabase } from "../../supabaseClient";
import type { Sale } from "../../types";
import { RepoResult, success, failure } from "./types";

const SALES_TABLE = "sales";

export async function fetchSales(): Promise<RepoResult<Sale[]>> {
  try {
    const { data, error } = await supabase
      .from(SALES_TABLE)
      .select("*")
      .order("date", { ascending: false });
    if (error)
      return failure({
        code: "supabase",
        message: "Không thể tải danh sách hóa đơn",
        cause: error,
      });
    return success((data || []) as Sale[]);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối tới máy chủ",
      cause: e,
    });
  }
}

export async function createSale(
  input: Partial<Sale>
): Promise<RepoResult<Sale>> {
  try {
    if (!input.items || !input.items.length)
      return failure({
        code: "validation",
        message: "Thiếu danh sách hàng hóa",
      });
    if (!input.total && input.total !== 0)
      return failure({ code: "validation", message: "Thiếu tổng tiền" });
    if (!input.paymentMethod)
      return failure({
        code: "validation",
        message: "Thiếu phương thức thanh toán",
      });
    const payload: any = {
      id: input.id,
      date: input.date || new Date().toISOString(),
      items: input.items,
      subtotal:
        input.subtotal ??
        input.items.reduce((s, it) => s + it.sellingPrice * it.quantity, 0),
      discount: input.discount ?? 0,
      total: input.total,
      customer: input.customer || { name: "Khách lẻ" },
      paymentMethod: input.paymentMethod,
      userId: input.userId || "unknown",
      userName: input.userName || "Unknown",
      branchId: input.branchId || "CN1",
      cashTransactionId: input.cashTransactionId,
    };
    const { data, error } = await supabase
      .from(SALES_TABLE)
      .insert([payload])
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Tạo hóa đơn thất bại",
        cause: error,
      });
    return success(data as Sale);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tạo hóa đơn",
      cause: e,
    });
  }
}

export async function deleteSaleById(
  id: string
): Promise<RepoResult<{ id: string }>> {
  try {
    const { error } = await supabase.from(SALES_TABLE).delete().eq("id", id);
    if (error)
      return failure({
        code: "supabase",
        message: "Xóa hóa đơn thất bại",
        cause: error,
      });
    return success({ id });
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa hóa đơn",
      cause: e,
    });
  }
}
