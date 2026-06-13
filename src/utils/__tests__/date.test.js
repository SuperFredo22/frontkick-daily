import { describe, it, expect } from 'vitest';
import { formatDate, addDays, startOfWeek, isSameDay, getLast30Days } from '../date';

describe('formatDate', () => {
  it('formate en YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 5, 12))).toBe('2026-06-12');
  });
  it('pad les mois et jours < 10', () => {
    expect(formatDate(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
  it('accepte une string', () => {
    expect(formatDate('2026-06-12T15:00:00')).toBe('2026-06-12');
  });
});

describe('addDays', () => {
  it('ajoute des jours en gérant les fins de mois', () => {
    expect(formatDate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });
  it('accepte un n négatif', () => {
    expect(formatDate(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28');
  });
});

describe('startOfWeek', () => {
  it('retourne le lundi de la semaine', () => {
    // 2026-06-12 est un vendredi → lundi = 2026-06-08
    expect(formatDate(startOfWeek(new Date(2026, 5, 12)))).toBe('2026-06-08');
  });
  it('un dimanche appartient à la semaine qui précède', () => {
    // 2026-06-14 est un dimanche → lundi = 2026-06-08
    expect(formatDate(startOfWeek(new Date(2026, 5, 14)))).toBe('2026-06-08');
  });
  it('un lundi reste le même jour', () => {
    expect(formatDate(startOfWeek(new Date(2026, 5, 8)))).toBe('2026-06-08');
  });
});

describe('isSameDay', () => {
  it('compare uniquement la date', () => {
    expect(isSameDay(new Date(2026, 5, 12, 8), new Date(2026, 5, 12, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 5, 12), new Date(2026, 5, 13))).toBe(false);
  });
});

describe('getLast30Days', () => {
  it('retourne 30 dates, la dernière étant aujourd’hui', () => {
    const days = getLast30Days();
    expect(days).toHaveLength(30);
    expect(days[29]).toBe(formatDate(new Date()));
  });
});
