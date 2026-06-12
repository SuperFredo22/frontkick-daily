import { useStorage } from './useStorage';

// Objectifs hebdomadaires (0 = désactivé)
export const DEFAULT_OBJECTIFS = { sport: 3, tiktok: 2, fightfocus: 0, marque: 0 };

export function useObjectifs() {
  return useStorage('objectifs', DEFAULT_OBJECTIFS);
}
