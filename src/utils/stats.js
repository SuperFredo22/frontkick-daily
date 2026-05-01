import { getStorage } from '../hooks/useStorage';
import { formatDate, getLast30Days, getMonthStart } from './date';

export function getJournalForDate(dateStr) {
  return getStorage(`journal_${dateStr}`) || null;
}

export function computeStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const journal = getJournalForDate(formatDate(d));
    const hasDone = journal && journal.taches && journal.taches.some(t => t.statut === 'fait');
    if (hasDone) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getMonthStats() {
  const start = getMonthStart();
  const today = new Date();
  let tiktok = 0, fightfocus = 0, marque = 0;

  const d = new Date(start);
  while (d <= today) {
    const journal = getJournalForDate(formatDate(d));
    if (journal && journal.taches) {
      journal.taches.forEach(t => {
        if (t.statut === 'fait') {
          if (t.banque === 'tiktok') tiktok++;
          else if (t.banque === 'fightfocus') fightfocus++;
          else if (t.banque === 'marque') marque++;
        }
      });
    }
    d.setDate(d.getDate() + 1);
  }

  return { tiktok, fightfocus, marque };
}

export function getLast30DaysStats() {
  return getLast30Days().map(dateStr => {
    const journal = getJournalForDate(dateStr);
    const prieres = journal?.habitudes?.prieres || 0;
    const sport = journal?.habitudes?.sport ? 1 : 0;
    const cigarettes = journal?.habitudes?.cigarettes || 0;
    const tachesFaites = journal?.taches?.filter(t => t.statut === 'fait').length || 0;
    return { date: dateStr, prieres, sport, cigarettes, tachesFaites };
  });
}

export function getCigaretteFreeDays() {
  return getLast30Days().filter(dateStr => {
    const journal = getJournalForDate(dateStr);
    return journal && (journal.habitudes?.cigarettes || 0) === 0;
  }).length;
}
