import { useStorage } from './useStorage';

// Liste des prospects (CRM léger). Voir types.js → Prospect.
export function useProspects() {
  return useStorage('prospects', []);
}
