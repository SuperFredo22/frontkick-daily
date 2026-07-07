import { describe, it, expect } from 'vitest';
import {
  workBlockForDate, hoursBetween, totalWorkHours, monthWorkHours, formatHeures, hasWorkSchedule,
} from './travail';

// 2026-07-06 est un lundi, 2026-07-07 un mardi, 2026-07-12 un dimanche.
const travail = {
  horaires: {
    1: { debut: '09:00', fin: '17:00' },
    2: { debut: '14:00', fin: '22:00' },
  },
  exceptions: {
    '2026-07-07': { debut: '10:00', fin: '15:00' }, // mardi modifié
    '2026-07-13': null,                             // lundi de repos exceptionnel
  },
};

describe('workBlockForDate', () => {
  it("renvoie l'horaire de la semaine type pour un jour travaillé", () => {
    expect(workBlockForDate(travail, '2026-07-06')).toEqual({ debut: '09:00', fin: '17:00' });
  });

  it('renvoie null pour un jour sans horaire', () => {
    expect(workBlockForDate(travail, '2026-07-12')).toBeNull(); // dimanche
  });

  it("fait primer l'exception du jour sur la semaine type", () => {
    expect(workBlockForDate(travail, '2026-07-07')).toEqual({
      debut: '10:00', fin: '15:00', exception: true,
    });
  });

  it('une exception null = repos même si le jour type est travaillé', () => {
    expect(workBlockForDate(travail, '2026-07-13')).toBeNull();
  });

  it('tolère un objet travail absent ou vide', () => {
    expect(workBlockForDate(null, '2026-07-06')).toBeNull();
    expect(workBlockForDate({}, '2026-07-06')).toBeNull();
  });
});

describe('hoursBetween', () => {
  it('calcule la durée en heures décimales', () => {
    expect(hoursBetween('09:00', '17:00')).toBe(8);
    expect(hoursBetween('09:30', '12:15')).toBe(2.75);
  });

  it('ne renvoie jamais de durée négative', () => {
    expect(hoursBetween('18:00', '09:00')).toBe(0);
  });
});

describe('totalWorkHours', () => {
  it('somme les heures effectives sur une plage de dates (exceptions comprises)', () => {
    // lundi 8h + mardi (exception) 5h + dimanche 0h
    const dates = ['2026-07-06', '2026-07-07', '2026-07-12'];
    expect(totalWorkHours(travail, dates)).toBe(13);
  });
});

describe('monthWorkHours', () => {
  it('sépare heures écoulées et heures prévues du mois, exceptions comprises', () => {
    // Juillet 2026 : lundis = 6, 13, 20, 27 ; mardis = 7, 14, 21, 28.
    // Semaine type : lun 8h + mar 8h. Exceptions : mar 7 → 5h, lun 13 → repos.
    // Prévu : 4 lundis (−1 repos) × 8h + 3 mardis × 8h + mar 7 (5h) = 53h.
    // Écoulé au 7 : lun 6 (8h) + mar 7 (5h) = 13h.
    const t = { ...travail, horaires: { 1: { debut: '09:00', fin: '17:00' }, 2: { debut: '09:00', fin: '17:00' } } };
    const { done, planned } = monthWorkHours(t, new Date(2026, 6, 7));
    expect(done).toBe(13);
    expect(planned).toBe(53);
  });

  it('renvoie zéro sans planning', () => {
    expect(monthWorkHours({ horaires: {}, exceptions: {} }, new Date(2026, 6, 7))).toEqual({ done: 0, planned: 0 });
  });
});

describe('formatHeures', () => {
  it('formate les heures pleines et fractionnaires', () => {
    expect(formatHeures(8)).toBe('8h');
    expect(formatHeures(7.5)).toBe('7h30');
  });
});

describe('hasWorkSchedule', () => {
  it('détecte un planning renseigné', () => {
    expect(hasWorkSchedule(travail)).toBe(true);
    expect(hasWorkSchedule({ horaires: {}, exceptions: {} })).toBe(false);
    expect(hasWorkSchedule(null)).toBe(false);
  });
});
