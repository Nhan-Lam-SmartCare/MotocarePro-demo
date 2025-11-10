import { supabase } from "../../supabaseClient";
import type { CashTransaction } from "../../types";
import { RepoResult, success, failure } from "./types";

const TABLE = "cash_transactions";

export interface CreateCashTxInput {
  type: CashTransaction["type"]; // "income" | "expense"
  amount: number;
  branchId: string;
  paymentSourceId: string; // maps to paymentSource column in DB
  date?: string;
  notes?: string;
  category?: string; // e.g. sale_income, debt_collection
  saleId?: string;
  workOrderId?: string;
  payrollRecordId?: string;
  loanPaymentId?: string;
  supplierId?: string;
  customerId?: string;
  recipient?: string; // human readable target
}

// Fetch cash transactions (optional filters)
export async function fetchCashTransactions(params?: {
  branchId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
}): Promise<RepoResult<CashTransaction[]>> {
  try {
    let query = supabase
      .from(TABLE)
      .select("*")
      .order("date", { ascending: false });
    if (params?.branchId) query = query.eq("branchId", params.branchId);
    if (params?.startDate) query = query.gte("date", params.startDate);
    if (params?.endDate) query = query.lte("date", params.endDate);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.type) query = query.eq("type", params.type); // requires column 'type' to exist; if not present will fail
    const { data, error } = await query;
    if (error)
      return failure({
        code: "supabase",
        message: "Không thể tải sổ quỹ",
        cause: error,
      });
    return success((data || []) as CashTransaction[]);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tải sổ quỹ",
      cause: e,
    });
  }
}

export async function createCashTransaction(
  input: CreateCashTxInput
): Promise<RepoResult<CashTransaction>> {
  try {
    if (!input.amount || input.amount <= 0)
      return failure({ code: "validation", message: "Số tiền phải > 0" });
    if (!input.branchId)
      return failure({ code: "validation", message: "Thiếu chi nhánh" });
    if (!input.paymentSourceId)
      return failure({ code: "validation", message: "Thiếu nguồn tiền" });
    if (!input.type)
      return failure({ code: "validation", message: "Thiếu loại thu/chi" });

    const payload: any = {
      amount: input.amount,
      branchId: input.branchId,
      paymentSource: input.paymentSourceId, // current DB column
      paymentSourceId: input.paymentSourceId, // future-proof if column added
      category:
        input.category ||
        (input.type === "income" ? "general_income" : "general_expense"),
      date: input.date || new Date().toISOString(),
      notes: input.notes,
      description: input.notes, // legacy column mapping
      type: input.type, // may require adding column in DB
      saleId: input.saleId,
      workOrderId: input.workOrderId,
      payrollRecordId: input.payrollRecordId,
      loanPaymentId: input.loanPaymentId,
      supplierId: input.supplierId,
      customerId: input.customerId,
      recipient: input.recipient,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Ghi sổ quỹ thất bại",
        cause: error,
      });
    return success(data as CashTransaction);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi ghi sổ quỹ",
      cause: e,
    });
  }
}
