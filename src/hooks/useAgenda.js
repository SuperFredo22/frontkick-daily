import { useStorage } from './useStorage';

export function useAgenda() {
  return useStorage('agenda', []);
}
