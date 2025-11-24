import { supabase } from "../../supabaseClient";
import type { Capital } from "../../types";
import { RepoResult, success, failure } from "./types";

// ========== CAPITAL ==========

export async function fetchCapitals(): Promise<RepoResult<Capital[]>> {
  try {
    const { data, error } = await supabase
      .from("capital")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      return failure({
        code: "supabase",
        message: "Không thể tải danh sách nguồn vốn",
        cause: error,
      });
    }

    // Map database fields to Capital type
    const capitals: Capital[] = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      sourceName: item.source_name,
      amount: parseFloat(item.amount),
      date: item.date,
      notes: item.notes,
      interestRate: item.interest_rate
        ? parseFloat(item.interest_rate)
        : undefined,
      interestType: item.interest_type,
      paymentFrequency: item.payment_frequency,
      maturityDate: item.maturity_date,
      branchId: item.branch_id,
      created_at: item.created_at,
    }));

    return success(capitals);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tải nguồn vốn",
      cause: e,
    });
  }
}

export async function createCapital(
  capital: Omit<Capital, "id" | "created_at">
): Promise<RepoResult<Capital>> {
  try {
    const { data, error } = await supabase
      .from("capital")
      .insert({
        type: capital.type,
        source_name: capital.sourceName,
        amount: capital.amount,
        date: capital.date,
        notes: capital.notes,
        interest_rate: capital.interestRate,
        interest_type: capital.interestType,
        payment_frequency: capital.paymentFrequency,
        maturity_date: capital.maturityDate,
        branch_id: capital.branchId,
      })
      .select()
      .single();

    if (error || !data) {
      return failure({
        code: "supabase",
        message: "Không thể thêm nguồn vốn",
        cause: error,
      });
    }

    return success({
      id: data.id,
      type: data.type,
      sourceName: data.source_name,
      amount: parseFloat(data.amount),
      date: data.date,
      notes: data.notes,
      interestRate: data.interest_rate
        ? parseFloat(data.interest_rate)
        : undefined,
      interestType: data.interest_type,
      paymentFrequency: data.payment_frequency,
      maturityDate: data.maturity_date,
      branchId: data.branch_id,
      created_at: data.created_at,
    } as Capital);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi thêm nguồn vốn",
      cause: e,
    });
  }
}

export async function updateCapital(
  id: string,
  updates: Partial<Capital>
): Promise<RepoResult<Capital>> {
  try {
    const updateData: any = {};
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.sourceName !== undefined)
      updateData.source_name = updates.sourceName;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.interestRate !== undefined)
      updateData.interest_rate = updates.interestRate;
    if (updates.interestType !== undefined)
      updateData.interest_type = updates.interestType;
    if (updates.paymentFrequency !== undefined)
      updateData.payment_frequency = updates.paymentFrequency;
    if (updates.maturityDate !== undefined)
      updateData.maturity_date = updates.maturityDate;

    const { data, error } = await supabase
      .from("capital")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return failure({
        code: "supabase",
        message: "Không thể cập nhật nguồn vốn",
        cause: error,
      });
    }

    return success({
      id: data.id,
      type: data.type,
      sourceName: data.source_name,
      amount: parseFloat(data.amount),
      date: data.date,
      notes: data.notes,
      interestRate: data.interest_rate
        ? parseFloat(data.interest_rate)
        : undefined,
      interestType: data.interest_type,
      paymentFrequency: data.payment_frequency,
      maturityDate: data.maturity_date,
      branchId: data.branch_id,
      created_at: data.created_at,
    } as Capital);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi cập nhật nguồn vốn",
      cause: e,
    });
  }
}

export async function deleteCapital(id: string): Promise<RepoResult<void>> {
  try {
    const { error } = await supabase.from("capital").delete().eq("id", id);

    if (error) {
      return failure({
        code: "supabase",
        message: "Không thể xóa nguồn vốn",
        cause: error,
      });
    }

    return success(undefined);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi xóa nguồn vốn",
      cause: e,
    });
  }
}
