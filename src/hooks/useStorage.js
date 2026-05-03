import { useState, useEffect, useRef } from 'react';

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

  // Track the current key and whether to skip the next write
  const keyRef = useRef(prefixedKey);
  const skipNextWriteRef = useRef(false);

  useEffect(() => {
    if (keyRef.current !== prefixedKey) {
      // Key changed (e.g. switching between today/yesterday):
      // load the new key's data — do NOT write old value to new key
      keyRef.current = prefixedKey;
      skipNextWriteRef.current = true;
      setValue(readFromStorage(prefixedKey));
    } else if (skipNextWriteRef.current) {
      // First render after a key change: value is freshly read from storage, skip write
      skipNextWriteRef.current = false;
    } else {
      // Normal case: value changed by user action → persist it
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(value));
      } catch (e) {
        console.error('localStorage write error', e);
      }
    }
  }, [prefixedKey, value]); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue];
}

export function getStorage(key) {
  try {
    const stored = localStorage.getItem(`fk_${key}`);
    return stored !== null ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(`fk_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write error', e);
  }
}
