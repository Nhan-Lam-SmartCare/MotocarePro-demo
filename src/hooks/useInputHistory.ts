import { useCallback, useMemo } from "react";

const MAX_HISTORY_ITEMS = 20;

export function useInputHistory(key: string) {
  const storageKey = useMemo(() => `input_history:${key}`, [key]);

  const getHistory = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const addToHistory = useCallback(
    (value: string) => {
      const next = value.trim();
      if (!next) return;

      const existing = getHistory().filter((item) => item !== next);
      const merged = [next, ...existing].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {
        // ignore storage errors
      }
    },
    [getHistory, storageKey]
  );

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  return {
    getHistory,
    addToHistory,
    clearHistory,
  };
}
