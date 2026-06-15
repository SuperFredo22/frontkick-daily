import { useStorage } from './useStorage';
import { jalonsInitial } from '../data/jalons';

// Persisted list of milestones (jalons). Same storage pattern as the banques.
export function useJalons() {
  return useStorage('jalons', jalonsInitial);
}
