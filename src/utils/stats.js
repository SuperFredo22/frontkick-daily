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
    const hasDone = journal?.taches?.some(t => t.statut === 'fait');
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
  const projets = {}; // { projetId: { count, nom } }

  const d = new Date(start);
  while (d <= today) {
    const journal = getJournalForDate(formatDate(d));
    if (journal?.taches) {
      journal.taches.forEach(t => {
        if (t.statut === 'fait') {
          if (t.banque === 'tiktok') tiktok++;
          else if (t.banque === 'fightfocus') fightfocus++;
          else if (t.banque === 'marque') marque++;
          else if (t.banque === 'projet' && t.projetId) {
            if (!projets[t.projetId]) projets[t.projetId] = { count: 0, nom: t.projetNom || 'Projet' };
            projets[t.projetId].count++;
          }
        }
      });
    }
    d.setDate(d.getDate() + 1);
  }

  return { tiktok, fightfocus, marque, projets };
}

// Nombre d'"actions importantes" (bonus) loguées depuis le début du mois.
export function getBonusMonthCount() {
  const start = getMonthStart();
  const today = new Date();
  let count = 0;
  const d = new Date(start);
  while (d <= today) {
    const journal = getJournalForDate(formatDate(d));
    count += (journal?.bonus || []).length;
    d.setDate(d.getDate() + 1);
  }
  return count;
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

export function getConsecutiveNoSportDays() {
  let count = 0;
  const today = new Date();
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const journal = getJournalForDate(formatDate(d));
    if (!journal) break; // no journal = app not used that day, stop counting
    const hasSport = journal?.sport || journal?.habitudes?.sport;
    if (!hasSport) count++;
    else break;
  }
  return count;
}

export function getSportMonthStats() {
  const start = getMonthStart();
  const today = new Date();
  let club = 0, gym = 0, maison = 0, autre = 0, totalDuree = 0;

  const d = new Date(start);
  while (d <= today) {
    const journal = getJournalForDate(formatDate(d));
    const sport = journal?.sport;
    if (sport) {
      if (sport.type === 'club') club++;
      else if (sport.type === 'gym') gym++;
      else if (sport.type === 'maison') maison++;
      else autre++;
      totalDuree += sport.duree_reelle || 0;
    } else if (journal?.habitudes?.sport) {
      autre++;
    }
    d.setDate(d.getDate() + 1);
  }

  const total = club + gym + maison + autre;
  const topType = [
    { key: 'club', count: club },
    { key: 'gym', count: gym },
    { key: 'maison', count: maison },
    { key: 'autre', count: autre },
  ].sort((a, b) => b.count - a.count)[0];

  return { club, gym, maison, autre, total, totalDuree, topType: topType?.count > 0 ? topType.key : null };
}

export function computeSportStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const journal = getJournalForDate(formatDate(d));
    const hasSport = journal?.sport || journal?.habitudes?.sport;
    if (hasSport) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function getSportLast30Days() {
  return getLast30Days().map(dateStr => {
    const journal = getJournalForDate(dateStr);
    const sport = journal?.sport;
    const legacy = journal?.habitudes?.sport;
    const did = !!(sport || legacy);
    return {
      date: dateStr,
      did: did ? 1 : 0,
      duree: sport?.duree_reelle || 0,
      type: sport?.type || (legacy ? 'autre' : null),
    };
  });
}

// Start of the current calendar quarter (Jan/Apr/Jul/Oct 1st).
export function getQuarterStart() {
  const d = new Date();
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}

// Number of training sessions logged since the start of the current quarter.
export function getSportQuarterCount() {
  const today = new Date();
  const d = new Date(getQuarterStart());
  let count = 0;
  while (d <= today) {
    const journal = getJournalForDate(formatDate(d));
    if (journal?.sport || journal?.habitudes?.sport) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
