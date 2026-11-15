"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fatisda_agama_preference";
const EVENT_NAME = "fatisda_agama_change";

/**
 * Shared hook that synchronizes the user's selected Pendidikan Agama filter
 * across localStorage and custom window change events.
 */
export function useAgamaPreference(
  defaultValue = "islam",
): [string, (value: string) => void] {
  const [agama, setAgamaState] = useState<string>(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAgamaState(saved);

      const handleAgamaChange = () => {
        const updated = localStorage.getItem(STORAGE_KEY);
        if (updated) setAgamaState(updated);
      };

      window.addEventListener(EVENT_NAME, handleAgamaChange);
      return () => window.removeEventListener(EVENT_NAME, handleAgamaChange);
    } catch {
      // Ignore storage exceptions in restricted contexts
    }
  }, []);

  const setAgama = useCallback((value: string) => {
    setAgamaState(value);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, value);
        window.dispatchEvent(new Event(EVENT_NAME));
      } catch {
        // Ignore storage quota / security exceptions
      }
    }
  }, []);

  return [agama, setAgama];
}
