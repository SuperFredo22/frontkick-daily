import { describe, it, expect, beforeEach } from 'vitest';
import {
  XP, sessionXP, levelFromXP, rankForLevel, dailyGoal,
  computeStats, computeBadges, mantraOfTheDay, MANTRAS,
} from './gamification';
import { formatDate } from './date';

function seedJournal(date, journal) {
  localStorage.setItem(`fk_journal_${formatDate(date)}`, JSON.stringify(journal));
}

beforeEach(() => localStorage.clear());

describe('sessionXP', () => {
  it('rewards the flat training XP when no duration is recorded', () => {
    expect(sessionXP(undefined)).toBe(XP.training);
    expect(sessionXP({})).toBe(XP.training);
  });

  it('scales with duration and caps at 140', () => {
    expect(sessionXP({ duree_reelle: 40 })).toBe(70); // 30 + 40
    expect(sessionXP({ duree_reelle: 500 })).toBe(140); // capped
  });
});

describe('levelFromXP', () => {
  it('starts at level 1 with zero XP', () => {
    const r = levelFromXP(0);
    expect(r.level).toBe(1);
    expect(r.intoLevel).toBe(0);
    expect(r.progress).toBe(0);
  });

  it('reaches level 2 at exactly 120 XP', () => {
    expect(levelFromXP(119).level).toBe(1);
    expect(levelFromXP(120).level).toBe(2);
  });

  it('keeps progress bounded between 0 and 1', () => {
    const r = levelFromXP(200);
    expect(r.progress).toBeGreaterThanOrEqual(0);
    expect(r.progress).toBeLessThanOrEqual(1);
    expect(r.toNext).toBe(r.levelSpan - r.intoLevel);
  });
});

describe('rankForLevel', () => {
  it('maps levels to the right rank band', () => {
    expect(rankForLevel(1).name).toBe('Recrue');
    expect(rankForLevel(3).name).toBe('Amateur');
    expect(rankForLevel(10).name).toBe('Contender');
    expect(rankForLevel(50).name).toBe('Champion');
  });
});

describe('dailyGoal', () => {
  it('starts at 60 and caps at 120', () => {
    expect(dailyGoal(1)).toBe(60);
    expect(dailyGoal(13)).toBe(120);
    expect(dailyGoal(99)).toBe(120);
  });
});

describe('computeStats', () => {
  it('aggregates missions, bonus, training and XP across journals', () => {
    seedJournal(new Date(2020, 0, 1), {
      taches: [{ statut: 'fait' }, { statut: 'fait' }],
      bonus: [{}, {}],
      habitudes: { prieres: 3, cigarettes: 0 },
    });
    seedJournal(new Date(2020, 0, 2), {
      taches: [{ statut: 'reporte' }],
      habitudes: { prieres: 0, cigarettes: 5, sport: true },
    });

    const s = computeStats();
    expect(s.missions).toBe(2);
    expect(s.bonus).toBe(2);
    expect(s.training).toBe(1);
    expect(s.prieres).toBe(3);
    expect(s.smokeFreeDays).toBe(1);
    expect(s.victoryDays).toBe(2);
    // 2*20 + 2*10 + 50 (flat training) + 3*5 + 1*15 + 2*25
    expect(s.totalXP).toBe(190);
  });

  it('returns zeros when there is no history', () => {
    const s = computeStats();
    expect(s.missions).toBe(0);
    expect(s.totalXP).toBe(0);
  });
});

describe('computeBadges', () => {
  it('unlocks badges once the target is reached', () => {
    const badges = computeBadges({
      missions: 1, bestStreak: 0, training: 0, smokeFreeDays: 0, prieres: 0, totalXP: 0,
    });
    const byId = Object.fromEntries(badges.map(b => [b.id, b]));
    expect(byId.first_strike.unlocked).toBe(true);
    expect(byId.fighter.unlocked).toBe(false);
    expect(byId.fighter.progress).toBeCloseTo(1 / 25);
  });
});

describe('mantraOfTheDay', () => {
  it('returns one of the known mantras', () => {
    expect(MANTRAS).toContain(mantraOfTheDay());
  });
});
