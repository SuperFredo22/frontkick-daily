import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate } from '../date';

// Stub localStorage (environnement node)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};

const { computeStreak, getCigaretteFreeDays, getSportMonthStats, computeSportStreak, getConsecutiveNoSportDays } =
  await import('../stats');

function setJournal(date, journal) {
  store.set(`fk_journal_${formatDate(date)}`, JSON.stringify(journal));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

beforeEach(() => {
  store.clear();
  vi.useRealTimers();
});

describe('computeStreak', () => {
  it('retourne 0 sans aucune donnée', () => {
    expect(computeStreak()).toBe(0);
  });

  it('compte les jours consécutifs avec au moins 1 tâche faite', () => {
    for (let i = 0; i < 3; i++) {
      setJournal(daysAgo(i), { taches: [{ statut: 'fait' }] });
    }
    expect(computeStreak()).toBe(3);
  });

  it("ne casse pas le streak si aujourd'hui n'a encore rien", () => {
    setJournal(daysAgo(1), { taches: [{ statut: 'fait' }] });
    setJournal(daysAgo(2), { taches: [{ statut: 'fait' }] });
    expect(computeStreak()).toBe(2);
  });

  it('s’arrête au premier trou', () => {
    setJournal(daysAgo(0), { taches: [{ statut: 'fait' }] });
    // daysAgo(1) vide
    setJournal(daysAgo(2), { taches: [{ statut: 'fait' }] });
    expect(computeStreak()).toBe(1);
  });

  it('ignore les tâches reportées', () => {
    setJournal(daysAgo(1), { taches: [{ statut: 'reporte' }] });
    expect(computeStreak()).toBe(0);
  });
});

describe('computeSportStreak', () => {
  it('compte sport détaillé et legacy habitudes.sport', () => {
    setJournal(daysAgo(0), { sport: { type: 'club' } });
    setJournal(daysAgo(1), { habitudes: { sport: true } });
    expect(computeSportStreak()).toBe(2);
  });
});

describe('getConsecutiveNoSportDays', () => {
  it('compte les jours sans sport en partant d’hier', () => {
    setJournal(daysAgo(1), { habitudes: {} });
    setJournal(daysAgo(2), { habitudes: {} });
    setJournal(daysAgo(3), { sport: { type: 'gym' } });
    expect(getConsecutiveNoSportDays()).toBe(2);
  });

  it('s’arrête quand l’app n’a pas été utilisée (pas de journal)', () => {
    setJournal(daysAgo(1), { habitudes: {} });
    // daysAgo(2) : pas de journal
    expect(getConsecutiveNoSportDays()).toBe(1);
  });
});

describe('getCigaretteFreeDays', () => {
  it('ne compte que les jours avec journal et 0 cigarette', () => {
    setJournal(daysAgo(0), { habitudes: { cigarettes: 0 } });
    setJournal(daysAgo(1), { habitudes: { cigarettes: 3 } });
    setJournal(daysAgo(2), { habitudes: {} });
    // les 27 autres jours : pas de journal → non comptés
    expect(getCigaretteFreeDays()).toBe(2);
  });
});

describe('getSportMonthStats', () => {
  it('agrège les types et les durées du mois', () => {
    // Fige la date en milieu de mois pour éviter les effets de bord en début de mois
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12));
    setJournal(new Date(2026, 5, 14), { sport: { type: 'club', duree_reelle: 60 } });
    setJournal(new Date(2026, 5, 13), { sport: { type: 'gym', duree_reelle: 45 } });
    setJournal(new Date(2026, 5, 12), { habitudes: { sport: true } }); // legacy → autre
    const stats = getSportMonthStats();
    expect(stats.club).toBe(1);
    expect(stats.gym).toBe(1);
    expect(stats.autre).toBe(1);
    expect(stats.total).toBe(3);
    expect(stats.totalDuree).toBe(105);
  });
});
