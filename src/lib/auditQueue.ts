import { supabase } from "../supabaseClient";
import type { AuditLogInput } from "./repository/auditLogsRepository";

type QueueItem = { userId: string | null; input: AuditLogInput };

const TABLE = "audit_logs";
let queue: QueueItem[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Tunables
let BATCH_SIZE = 10;
let FLUSH_INTERVAL_MS = 2000;
let listenersAttached = false;

function formatPayload({ userId, input }: QueueItem) {
  return {
    user_id: userId,
    action: input.action,
    table_name: input.tableName ?? null,
    record_id: input.recordId ?? null,
    old_data: input.oldData ? JSON.stringify(input.oldData) : null,
    new_data: input.newData ? JSON.stringify(input.newData) : null,
    ip_address: input.ipAddress ?? null,
    user_agent:
      input.userAgent ||
      (typeof navigator !== "undefined" ? navigator.userAgent : null),
  } as const;
}

async function flushInternal(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    const payloads = batch.map(formatPayload);
    await supabase.from(TABLE).insert(payloads);
  } catch (e) {
    // best-effort: drop on failure in production; in dev, log it
    if ((import.meta as any)?.env?.DEV) {
      console.warn("auditQueue flush failed", e);
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushInternal();
  }, FLUSH_INTERVAL_MS);
}

function attachLifecycleListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  const handler = () => {
    // Try to flush immediately; keepalive fetch is not available via supabase client,
    // but a normal async call is still better than nothing.
    void flushInternal();
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") handler();
  });
  window.addEventListener("beforeunload", handler);
}

export function enqueueAudit(userId: string | null, input: AuditLogInput) {
  attachLifecycleListeners();
  queue.push({ userId, input });
  if (queue.length >= BATCH_SIZE) {
    // flush now (don’t await)
    void flushInternal();
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    return;
  }
  scheduleFlush();
}

// Testing hooks
export function _setBatchingOptions(opts: {
  size?: number;
  intervalMs?: number;
}) {
  if (typeof opts.size === "number") BATCH_SIZE = opts.size;
  if (typeof opts.intervalMs === "number") FLUSH_INTERVAL_MS = opts.intervalMs;
}
export function _getQueueLength() {
  return queue.length;
}
export async function _flushNowForTest() {
  await flushInternal();
}
