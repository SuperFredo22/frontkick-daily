import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEMES, computeUnlocks, newlyUnlockedByLevel, getTitle,
  getEquippedThemeId, equipTheme, applyTheme,
} from './unlockables';

beforeEach(() => localStorage.clear());

describe('computeUnlocks', () => {
  it('unlocks themes at or above their level and titles meeting their condition', () => {
    const { themes, titles } = computeUnlocks({ level: 4, bestStreak: 0 });
    const braise = themes.find(t => t.id === 'braise');
    const acier = themes.find(t => t.id === 'acier');
    const venin = themes.find(t => t.id === 'venin');
    expect(braise.unlocked).toBe(true);   // level 1
    expect(acier.unlocked).toBe(true);    // level 4
    expect(venin.unlocked).toBe(false);   // level 8

    const determine = titles.find(t => t.id === 'determine');
    const lion = titles.find(t => t.id === 'lion');
    expect(determine.unlocked).toBe(true); // level >= 3
    expect(lion.unlocked).toBe(false);     // level >= 6
  });
});

describe('newlyUnlockedByLevel', () => {
  it('returns only items crossed between prev and new level', () => {
    const out = newlyUnlockedByLevel(1, 4);
    expect(out).toContainEqual(expect.objectContaining({ kind: 'Thème', name: 'Acier' }));
    expect(out).toContainEqual(expect.objectContaining({ kind: 'Titre', name: 'Le Déterminé' }));
    // braise (level 1) was already owned, not newly unlocked
    expect(out.some(o => o.name === 'Braise')).toBe(false);
  });

  it('returns nothing when no threshold is crossed', () => {
    expect(newlyUnlockedByLevel(4, 5)).toEqual([]);
  });
});

describe('getTitle', () => {
  it('returns the matching title or falls back to the first', () => {
    expect(getTitle('lion').name).toBe('Cœur de Lion');
    expect(getTitle('does-not-exist').id).toBe('recrue');
  });
});

describe('equipped theme persistence', () => {
  it('defaults to braise and persists the equipped theme', () => {
    expect(getEquippedThemeId()).toBe('braise');
    equipTheme('acier');
    expect(getEquippedThemeId()).toBe('acier');
  });

  it('applyTheme writes the accent CSS variables on :root', () => {
    applyTheme('acier');
    const red = document.documentElement.style.getPropertyValue('--red');
    expect(red).toBe(THEMES.find(t => t.id === 'acier').vars['--red']);
  });
});
