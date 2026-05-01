import { useStorage } from './useStorage';
import { formatDate } from '../utils/date';

export function useJournal(date) {
  const key = `journal_${formatDate(date)}`;
  const defaultJournal = {
    date: formatDate(date),
    taches: [],
    habitudes: { prieres: 0, sport: false, cigarettes: 0, note: '' },
    bonus: [],
    agendaBlocs: [],
  };
  return useStorage(key, defaultJournal);
}

export function useReporteAujourdhui(date) {
  const key = `reporte_${formatDate(date)}`;
  return useStorage(key, []);
}
