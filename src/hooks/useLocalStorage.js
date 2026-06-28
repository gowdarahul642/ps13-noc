import { useState, useEffect } from 'react';

/**
 * Persists state to localStorage under the given key.
 * Falls back gracefully if localStorage is unavailable (e.g. private browsing).
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded or disabled */ }
  }, [key, value]);

  return [value, setValue];
}
