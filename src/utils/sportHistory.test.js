import { describe, it, expect, beforeEach } from 'vitest';
import { lastExerciseEntry, exerciseSummary } from './sportHistory';

beforeEach(() => localStorage.clear());

function seedSport(date, exercices) {
  localStorage.setItem(`fk_journal_${date}`, JSON.stringify({ date, sport: { type: 'autre', exercices } }));
}

describe('lastExerciseEntry', () => {
  it('renvoie l’occurrence la plus récente, insensible à la casse', () => {
    seedSport('2026-06-20', [{ nom: 'Tractions pronation', series: 3, reps: '6', charge: 'bande 35 kg' }]);
    seedSport('2026-06-30', [{ nom: 'tractions PRONATION', series: 4, reps: '8', charge: 'bande 25 kg' }]);
    const hit = lastExerciseEntry('Tractions Pronation ');
    expect(hit.date).toBe('2026-06-30');
    expect(hit.exercice.charge).toBe('bande 25 kg');
  });

  it('ignore la date exclue (jour en cours de saisie)', () => {
    seedSport('2026-06-30', [{ nom: 'Pompes', series: 5, reps: '20', charge: null }]);
    seedSport('2026-07-07', [{ nom: 'Pompes', series: 1, reps: '1', charge: null }]);
    expect(lastExerciseEntry('pompes', '2026-07-07').date).toBe('2026-06-30');
  });

  it('renvoie null sans historique ou pour un nom vide', () => {
    expect(lastExerciseEntry('inconnu')).toBeNull();
    expect(lastExerciseEntry('   ')).toBeNull();
  });

  it('ignore les journaux sans exercices (séances classiques, legacy)', () => {
    localStorage.setItem('fk_journal_2026-06-01', JSON.stringify({ sport: { type: 'club' } }));
    localStorage.setItem('fk_journal_2026-06-02', 'pas du json');
    expect(lastExerciseEntry('tractions')).toBeNull();
  });
});

describe('exerciseSummary', () => {
  it('assemble séries × reps · charge', () => {
    expect(exerciseSummary({ series: 4, reps: '8', charge: 'bande 25 kg' })).toBe('4 × 8 · bande 25 kg');
    expect(exerciseSummary({ series: null, reps: 'max', charge: null })).toBe('max');
    expect(exerciseSummary({ series: 3, reps: null, charge: null })).toBe('3 × ?');
    expect(exerciseSummary(null)).toBe('');
  });
});
