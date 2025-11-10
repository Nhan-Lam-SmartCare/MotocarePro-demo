// Generic repository result wrapper
export type RepoSuccess<T> = { ok: true; data: T; meta?: Record<string, any> };
export type RepoError = { ok: false; error: RepoErrorDetail };

export interface RepoErrorDetail {
  code: "network" | "validation" | "not_found" | "supabase" | "unknown";
  message: string;
  cause?: any;
}

export type RepoResult<T> = RepoSuccess<T> | RepoError;

export const success = <T>(
  data: T,
  meta?: Record<string, any>
): RepoSuccess<T> => ({ ok: true, data, meta });
export const failure = (detail: RepoErrorDetail): RepoError => {
  // In dev, track errors globally for the RepoErrorPanel
  try {
    if (typeof window !== "undefined" && (import.meta as any)?.env?.DEV) {
      window.__repoErrors = window.__repoErrors || [];
      window.__repoErrors.push(detail);
      // Fire an event so listeners (Dev Error Panel) can update immediately
      window.dispatchEvent(new CustomEvent("repo-error", { detail }));
    }
  } catch {}
  return {
    ok: false,
    error: detail,
  };
};

// Collect errors globally in dev for RepoErrorPanel
declare global {
  interface Window {
    __repoErrors?: RepoErrorDetail[];
  }
}
if (typeof window !== "undefined") {
  window.__repoErrors = window.__repoErrors || [];
}

// Legacy explicit tracking helper (now automatic via failure in dev)
export const failureWithTrack = failure;

// Map error to admin friendly string (can be shown in dev tools panel)
export const mapRepoErrorForAdmin = (err: RepoErrorDetail): string => {
  const code = err.code.toUpperCase();
  const base = `[${code}] ${err.message}`;
  if (err.code === "supabase" && err.cause?.message) {
    return `${base} :: ${err.cause.message}`;
  }
  return base;
};
