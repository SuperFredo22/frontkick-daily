import { describe, it, expect, beforeEach } from 'vitest';
import {
  lastCompletedWeekStart, collectWeekData, buildRevuePrompt,
  getRevues, saveRevue, canAutoAttempt, markAttempt,
} from './revueHebdo';

beforeEach(() => localStorage.clear());

function seed(ds, journal) {
  localStorage.setItem(`fk_journal_${ds}`, JSON.stringify(journal));
}

describe('lastCompletedWeekStart', () => {
  it('renvoie le lundi de la semaine précédente', () => {
    // Mardi 7 juillet 2026 → semaine en cours commence lundi 6 → complète = lundi 29 juin
    expect(lastCompletedWeekStart(new Date('2026-07-07T12:00:00'))).toBe('2026-06-29');
    // Lundi 6 juillet → pareil
    expect(lastCompletedWeekStart(new Date('2026-07-06T12:00:00'))).toBe('2026-06-29');
    // Dimanche 5 juillet : la semaine du 29/06 est encore en cours → complète = 22 juin
    expect(lastCompletedWeekStart(new Date('2026-07-05T12:00:00'))).toBe('2026-06-22');
  });
});

describe('collectWeekData', () => {
  it('agrège XP, missions, sport, habitudes et relances sur les 7 jours', () => {
    seed('2026-06-29', {
      taches: [
        { statut: 'fait', banque: 'tiktok' },
        { statut: 'fait', banque: 'marque' },
      ],
      habitudes: { prieres: 2, cigarettes: 0, sport: true, note: 'bonne journée' },
      bonus: [{ texte: '📇 Relance : Karim' }, { texte: 'autre bonus' }],
      sport: { type: 'autre', seance_nom: 'Tractions parc', duree_reelle: 40, exercices: [{ nom: 'Tractions' }] },
    });
    seed('2026-07-01', {
      taches: [],
      habitudes: { prieres: 0, cigarettes: 4, sport: false, note: '' },
      bonus: [],
    });

    const d = collectWeekData('2026-06-29');
    expect(d.daysWithData).toBe(2);
    expect(d.missions).toBe(2);
    expect(d.videos).toBe(1);
    expect(d.seances).toHaveLength(1);
    expect(d.seances[0]).toMatchObject({ nom: 'Tractions parc', duree: 40, exos: 1 });
    expect(d.minutesSport).toBe(40);
    expect(d.prieres).toBe(2);
    expect(d.cigarettes).toBe(4);
    expect(d.joursSansClope).toBe(1);
    expect(d.relances).toEqual(['Relance : Karim']);
    expect(d.notes).toEqual([{ date: '2026-06-29', text: 'bonne journée' }]);
    expect(d.xp).toBeGreaterThan(0);
  });

  it('semaine vide → daysWithData 0', () => {
    expect(collectWeekData('2026-06-29').daysWithData).toBe(0);
  });
});

describe('buildRevuePrompt', () => {
  it('embarque les chiffres et la comparaison à la semaine précédente', () => {
    const data = collectWeekData('2026-06-29');
    seed('2026-06-29', { taches: [{ statut: 'fait', banque: 'tiktok' }], habitudes: { prieres: 1, cigarettes: 2 }, bonus: [] });
    const cur = collectWeekData('2026-06-29');
    const prev = { ...data, daysWithData: 3, xp: 10, missions: 0, seances: [], prieres: 0, cigarettes: 5 };
    const { system, user } = buildRevuePrompt(cur, prev);
    expect(system).toContain('sans aucun markdown');
    expect(user).toContain('Semaine du 2026-06-29');
    expect(user).toContain('Missions accomplies : 1 (+1)');
    expect(user).toContain('Cigarettes : 2 (-3)');
  });

  it('omet la comparaison quand la semaine précédente est vide', () => {
    seed('2026-06-29', { taches: [], habitudes: { prieres: 1, cigarettes: 0 }, bonus: [] });
    const cur = collectWeekData('2026-06-29');
    const { user } = buildRevuePrompt(cur, { daysWithData: 0 });
    expect(user).not.toContain('vs semaine précédente');
  });
});

describe('persistance des revues', () => {
  it('sauvegarde, remplace la même semaine, trie par semaine décroissante', () => {
    saveRevue('2026-06-22', 'ancienne');
    saveRevue('2026-06-29', 'v1');
    saveRevue('2026-06-29', 'v2');
    const revues = getRevues();
    expect(revues).toHaveLength(2);
    expect(revues[0]).toMatchObject({ weekStart: '2026-06-29', texte: 'v2' });
    expect(revues[1].weekStart).toBe('2026-06-22');
  });
});

describe('garde-fou de génération auto', () => {
  it('bloque une deuxième tentative dans les 10 minutes', () => {
    const t0 = 1_000_000_000;
    expect(canAutoAttempt(t0)).toBe(true);
    markAttempt(t0);
    expect(canAutoAttempt(t0 + 5 * 60 * 1000)).toBe(false);
    expect(canAutoAttempt(t0 + 11 * 60 * 1000)).toBe(true);
  });
});
