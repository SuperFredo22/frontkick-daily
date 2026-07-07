import { describe, it, expect, beforeEach } from 'vitest';
import { addBonusToJournal } from './journalLog';

beforeEach(() => localStorage.clear());

const read = (ds) => JSON.parse(localStorage.getItem(`fk_journal_${ds}`));

describe('addBonusToJournal', () => {
  it('crée le journal du jour s’il n’existe pas et y ajoute le bonus', () => {
    expect(addBonusToJournal('2026-07-07', '📇 Relance : Karim')).toBe(true);
    const j = read('2026-07-07');
    expect(j.date).toBe('2026-07-07');
    expect(j.bonus).toHaveLength(1);
    expect(j.bonus[0].texte).toBe('📇 Relance : Karim');
    expect(j.taches).toEqual([]);
    expect(j.habitudes.prieres).toBe(0);
  });

  it('préserve le journal existant (tâches, habitudes, bonus antérieurs)', () => {
    localStorage.setItem('fk_journal_2026-07-07', JSON.stringify({
      date: '2026-07-07',
      taches: [{ id: 1, statut: 'fait' }],
      habitudes: { prieres: 3, sport: true, cigarettes: 1, note: 'ok' },
      bonus: [{ id: 1, texte: 'existant' }],
    }));
    addBonusToJournal('2026-07-07', 'nouveau');
    const j = read('2026-07-07');
    expect(j.taches).toHaveLength(1);
    expect(j.habitudes.prieres).toBe(3);
    expect(j.bonus.map(b => b.texte)).toEqual(['existant', 'nouveau']);
  });

  it('refuse un texte vide ou une date absente', () => {
    expect(addBonusToJournal('2026-07-07', '  ')).toBe(false);
    expect(addBonusToJournal('', 'texte')).toBe(false);
    expect(localStorage.length).toBe(0);
  });
});
