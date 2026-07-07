import { useStorage } from './useStorage';
import { EMPTY_TRAVAIL } from '../utils/travail';

// Horaires de travail (semaine type + exceptions par date). Voir utils/travail.js.
export function useTravail() {
  return useStorage('travail', EMPTY_TRAVAIL);
}
