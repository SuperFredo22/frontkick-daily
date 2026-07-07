import { describe, it, expect } from 'vitest';
import { dueProspects, sortProspects, isOpenProspect, statutConfig } from './prospects';

const TODAY = '2026-07-07';

const prospects = [
  { id: 1, nom: 'Alice',   statut: 'a_contacter', creeLe: 100 },
  { id: 2, nom: 'Bruno',   statut: 'contacte',    relanceDate: '2026-07-05', creeLe: 200 }, // due (en retard)
  { id: 3, nom: 'Chloé',   statut: 'relance',     relanceDate: '2026-07-07', creeLe: 300 }, // due (aujourd'hui)
  { id: 4, nom: 'David',   statut: 'contacte',    relanceDate: '2026-07-20', creeLe: 400 }, // pas encore due
  { id: 5, nom: 'Emma',    statut: 'gagne',       relanceDate: '2026-07-01', creeLe: 500 }, // clos → jamais due
  { id: 6, nom: 'Farid',   statut: 'perdu',       creeLe: 600 },
];

describe('dueProspects', () => {
  it('renvoie les prospects ouverts dont la relance est due (≤ aujourd’hui)', () => {
    expect(dueProspects(prospects, TODAY).map(p => p.id)).toEqual([2, 3]);
  });

  it('ignore les prospects gagnés/perdus même avec une relance passée', () => {
    expect(dueProspects(prospects, TODAY).some(p => p.id === 5)).toBe(false);
  });

  it('tolère une liste vide ou absente', () => {
    expect(dueProspects([], TODAY)).toEqual([]);
    expect(dueProspects(null, TODAY)).toEqual([]);
  });
});

describe('sortProspects', () => {
  it('classe : relances dues (plus ancienne d’abord), puis ouverts récents, puis clos', () => {
    expect(sortProspects(prospects, TODAY).map(p => p.id)).toEqual([2, 3, 4, 1, 6, 5]);
  });

  it('ne mute pas la liste d’origine', () => {
    const copy = [...prospects];
    sortProspects(prospects, TODAY);
    expect(prospects).toEqual(copy);
  });
});

describe('isOpenProspect / statutConfig', () => {
  it('distingue ouverts et clos', () => {
    expect(isOpenProspect({ statut: 'relance' })).toBe(true);
    expect(isOpenProspect({ statut: 'gagne' })).toBe(false);
  });

  it('retombe sur « À contacter » pour un statut inconnu', () => {
    expect(statutConfig('inconnu').key).toBe('a_contacter');
  });
});
