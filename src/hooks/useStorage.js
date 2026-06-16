import { useState, useEffect, useRef, useCallback } from 'react';

export function useStorage(key, defaultValue) {
  const prefixedKey = `fk_${key}`;

  const readFromStorage = (k) => {
    try {
      const stored = localStorage.getItem(k);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      console.warn(`[useStorage] Could not parse stored value for key "${k}", using default`);
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  };

  const [value, setValue] = useState(() => readFromStorage(prefixedKey));
  const prevKeyRef = useRef(prefixedKey);

  // When key changes (today ↔ yesterday), reload from storage — no write
  useEffect(() => {
    if (prevKeyRef.current !== prefixedKey) {
      prevKeyRef.current = prefixedKey;
      setValue(readFromStorage(prefixedKey));
    }
  }, [prefixedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setter that writes to localStorage atomically with the state update.
  // Using prefixedKey from the closure guarantees we always write to the correct key
  // for this render cycle — no separate write-on-render effect needed.
  const setValueAndPersist = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(next));
      } catch (e) {
        console.error('localStorage write error', e);
      }
      return next;
    });
  }, [prefixedKey]);

  return [value, setValueAndPersist];
}

export function getStorage(key) {
  try {
    const stored = localStorage.getItem(`fk_${key}`);
    return stored !== null ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
