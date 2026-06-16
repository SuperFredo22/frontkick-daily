import { describe, it, expect } from 'vitest';
import { formatDate, addDays, isSameDay, startOfWeek, getLast30Days } from './date';

describe('formatDate', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('accepts a date string', () => {
    expect(formatDate('2026-06-16')).toBe('2026-06-16');
  });
});

describe('addDays', () => {
  it('adds and subtracts days without mutating the input', () => {
    const base = new Date(2026, 5, 16);
    expect(formatDate(addDays(base, 1))).toBe('2026-06-17');
    expect(formatDate(addDays(base, -1))).toBe('2026-06-15');
    expect(formatDate(base)).toBe('2026-06-16'); // unchanged
  });

  it('rolls over month boundaries', () => {
    expect(formatDate(addDays(new Date(2026, 5, 30), 1))).toBe('2026-07-01');
  });
});

describe('isSameDay', () => {
  it('ignores the time component', () => {
    expect(isSameDay(new Date(2026, 5, 16, 9), new Date(2026, 5, 16, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 5, 16), new Date(2026, 5, 17))).toBe(false);
  });
});

describe('startOfWeek', () => {
  it('returns the Monday of the week', () => {
    // 2026-06-16 is a Tuesday → Monday is the 15th.
    expect(formatDate(startOfWeek(new Date(2026, 5, 16)))).toBe('2026-06-15');
  });

  it('treats Sunday as the end of the week (previous Monday)', () => {
    // 2026-06-21 is a Sunday → Monday is the 15th.
    expect(formatDate(startOfWeek(new Date(2026, 5, 21)))).toBe('2026-06-15');
  });
});

describe('getLast30Days', () => {
  it('returns 30 ascending days ending today', () => {
    const days = getLast30Days();
    expect(days).toHaveLength(30);
    expect(days[29]).toBe(formatDate(new Date()));
    expect(days[0] < days[29]).toBe(true);
  });
});
