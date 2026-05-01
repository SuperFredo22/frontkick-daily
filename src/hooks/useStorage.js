import { useState, useEffect } from 'react';

export function useStorage(key, defaultValue) {
  const prefixedKey = `fk_${key}`;

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(prefixedKey);
      if (stored !== null) return JSON.parse(stored);
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    } catch {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage write error', e);
    }
  }, [prefixedKey, value]);

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
