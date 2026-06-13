import { useState, useEffect, useCallback } from 'react';
import { getProgression } from '../utils/gamification';

/**
 * Live combatant progression (level, XP, win streak, badges) derived from
 * the journal history. Recomputes on mount, on tab focus, and whenever any
 * `fk_journal_*` key changes in localStorage (cross-tab + manual refresh).
 */
export function useProgression() {
  const [prog, setProg] = useState(() => getProgression());

  const refresh = useCallback(() => setProg(getProgression()), []);

  useEffect(() => {
    // Initial value is already seeded by useState(getProgression); here we only
    // subscribe to changes (tab focus + localStorage writes).
    const onFocus = () => refresh();
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith('fk_journal_') || e.key.startsWith('fk_')) refresh();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  return [prog, refresh];
}
