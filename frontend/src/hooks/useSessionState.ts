import { useEffect, useState } from "react";

// Like useState, but persisted to sessionStorage so the value survives leaving
// and returning to a page within the same browser session (e.g. opening a
// product and coming back to the dashboard).
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / availability errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}
