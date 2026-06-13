import { useStorage } from './useStorage';
import { projetsInitial } from '../data/projets';

export function useProjets() {
  return useStorage('projets', projetsInitial);
}

export const PROJET_PALETTE = ['#FF5757', '#00B4D8', '#FF9F1C', '#2ED47A', '#7C3AED', '#64748B'];

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
