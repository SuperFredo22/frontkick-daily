import { useStorage } from './useStorage';
import { projetsInitial } from '../data/projets';

export function useProjets() {
  return useStorage('projets', projetsInitial);
}

export const PROJET_PALETTE = ['#C0392B', '#00b4d8', '#E67E22', '#27AE60', '#8E44AD', '#2C3E50'];

export function getNextProjetTask(projet, skippedToday) {
  if (!projet?.taches?.length) return null;
  return projet.taches.find(t =>
    t.statut === 'a_faire' &&
    !skippedToday.includes(`projet_${projet.id}_${t.id}`)
  ) || null;
}

export function getActiveProjects(projets, skippedToday) {
  return (projets || []).filter(p =>
    p.taches?.some(t =>
      t.statut === 'a_faire' &&
      !skippedToday.includes(`projet_${p.id}_${t.id}`)
    )
  );
}
