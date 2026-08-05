import { supabaseV1 } from "../../supabaseClient";
import type { PaymentSource } from "../../types";
import { RepoResult, success, failure } from "./types";

// Payment sources are shared reference data — always use V1.
const supabase = supabaseV1;
import { safeAudit } from "./auditLogsRepository";

const TABLE = "payment_sources";
const CACHE_KEY = "motocare_cached_payment_sources";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

let memoryPaymentSourcesCache: { timestamp: number; data: PaymentSource[] } | null = null;

export function clearPaymentSourcesCache() {
  memoryPaymentSourcesCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (_e) {
    void _e;
  }
}

export async function fetchPaymentSources(forceRefresh = false): Promise<
  RepoResult<PaymentSource[]>
> {
  try {
    const now = Date.now();
    if (!forceRefresh && memoryPaymentSourcesCache && now - memoryPaymentSourcesCache.timestamp < CACHE_TTL_MS) {
      return success(memoryPaymentSourcesCache.data);
    }

    if (!forceRefresh) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && now - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data)) {
            memoryPaymentSourcesCache = parsed;
            return success(parsed.data);
          }
        }
      } catch (_e) {
        void _e;
      }
    }

    const { data, error } = await supabase.from(TABLE).select("*");
    if (error)
      return failure({
        code: "supabase",
        message: "Không thể tải nguồn tiền",
        cause: error,
      });

    const result = (data || []) as PaymentSource[];
    memoryPaymentSourcesCache = { timestamp: now, data: result };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryPaymentSourcesCache));
    } catch (_e) {
      void _e;
    }

    return success(result);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi tải nguồn tiền",
      cause: e,
    });
  }
}


// Atomic balance update (fetch current -> merge -> update). Expect balance JSON shape.
export async function updatePaymentSourceBalance(
  id: string,
  branchId: string,
  delta: number
): Promise<RepoResult<PaymentSource>> {
  try {
    // Fetch current row
    const { data: current, error: fetchErr } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !current)
      return failure({
        code: "supabase",
        message: "Không tìm thấy nguồn tiền",
        cause: fetchErr,
      });

    const balance = current.balance || {};
    const newBalance = {
      ...balance,
      [branchId]: (balance[branchId] || 0) + delta,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .update({ balance: newBalance })
      .eq("id", id)
      .select()
      .single();
    if (error || !data)
      return failure({
        code: "supabase",
        message: "Cập nhật số dư thất bại",
        cause: error,
      });
    // Audit balance adjustment
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch (_e) {
      void _e;
    }
    await safeAudit(userId, {
      action: "payment_source.balance_adjust",
      tableName: TABLE,
      recordId: id,
      oldData: { balance },
      newData: { balance: newBalance, delta, branchId },
    });
    clearPaymentSourcesCache();
    return success(data as PaymentSource);
  } catch (e: any) {
    return failure({
      code: "network",
      message: "Lỗi kết nối khi cập nhật số dư",
      cause: e,
    });
  }
}
