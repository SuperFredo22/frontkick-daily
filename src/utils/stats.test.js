import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMonthStats, getBonusMonthCount, getCigaretteFreeDays,
  getConsecutiveNoSportDays, computeSportStreak,
} from './stats';
import { formatDate, addDays } from './date';

function seedJournal(date, journal) {
  localStorage.setItem(`fk_journal_${formatDate(date)}`, JSON.stringify(journal));
}

const daysAgo = (n) => addDays(new Date(), -n);

beforeEach(() => localStorage.clear());

describe('getMonthStats', () => {
  it('counts completed tasks by banque for the current month', () => {
    seedJournal(new Date(), {
      taches: [
        { statut: 'fait', banque: 'tiktok' },
        { statut: 'fait', banque: 'tiktok' },
        { statut: 'fait', banque: 'marque' },
        { statut: 'a_faire', banque: 'fightfocus' },
      ],
    });
    const s = getMonthStats();
    expect(s.tiktok).toBe(2);
    expect(s.marque).toBe(1);
    expect(s.fightfocus).toBe(0);
  });

  it('aggregates project tasks under their project id', () => {
    seedJournal(new Date(), {
      taches: [{ statut: 'fait', banque: 'projet', projetId: 7, projetNom: 'Site' }],
    });
    const s = getMonthStats();
    expect(s.projets[7]).toEqual({ count: 1, nom: 'Site' });
  });
});

describe('getBonusMonthCount', () => {
  it('sums bonus actions logged this month', () => {
    seedJournal(new Date(), { bonus: [{}, {}, {}] });
    expect(getBonusMonthCount()).toBe(3);
  });

  it('is zero with no data', () => {
    expect(getBonusMonthCount()).toBe(0);
  });
});

describe('getCigaretteFreeDays', () => {
  it('counts days with a journal and zero cigarettes', () => {
    seedJournal(daysAgo(0), { habitudes: { cigarettes: 0 } });
    seedJournal(daysAgo(1), { habitudes: { cigarettes: 3 } });
    seedJournal(daysAgo(2), { habitudes: { cigarettes: 0 } });
    expect(getCigaretteFreeDays()).toBe(2);
  });
});

describe('getConsecutiveNoSportDays', () => {
  it('counts back from yesterday while journals exist without sport', () => {
    seedJournal(daysAgo(1), { habitudes: {} });
    seedJournal(daysAgo(2), { habitudes: {} });
    // daysAgo(3) intentionally not seeded → the streak stops there.
    expect(getConsecutiveNoSportDays()).toBe(2);
  });

  it('stops at the first day with a sport session', () => {
    seedJournal(daysAgo(1), { sport: { type: 'club' } });
    seedJournal(daysAgo(2), { habitudes: {} });
    expect(getConsecutiveNoSportDays()).toBe(0);
  });
});

describe('computeSportStreak', () => {
  it('counts consecutive days with a training session up to today', () => {
    seedJournal(daysAgo(0), { sport: { type: 'gym' } });
    seedJournal(daysAgo(1), { habitudes: { sport: true } });
    // daysAgo(2) missing → streak is 2.
    expect(computeSportStreak()).toBe(2);
  });
});
