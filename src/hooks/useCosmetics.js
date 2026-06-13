import { useState, useEffect, useCallback } from 'react';
import {
  getEquippedThemeId, getEquippedTitleId,
  equipTheme as doEquipTheme, equipTitle as doEquipTitle,
  COSMETICS_EVENT,
} from '../utils/unlockables';

/**
 * Live view of the equipped cosmetics (theme + title). Re-renders whenever
 * cosmetics change (custom event) or another tab updates localStorage.
 */
export function useCosmetics() {
  const [themeId, setThemeId] = useState(getEquippedThemeId);
  const [titleId, setTitleId] = useState(getEquippedTitleId);

  const sync = useCallback(() => {
    setThemeId(getEquippedThemeId());
    setTitleId(getEquippedTitleId());
  }, []);

  useEffect(() => {
    window.addEventListener(COSMETICS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COSMETICS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  return {
    themeId,
    titleId,
    equipTheme: doEquipTheme,
    equipTitle: doEquipTitle,
  };
}
