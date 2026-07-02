import { describe, it, expect, beforeEach } from 'vitest';
import { mergeNewSeeds } from './seedMerge';
import { marqueInitial } from '../data/marque';

const readMarque = () => JSON.parse(localStorage.getItem('fk_marque'));

describe('purge des tâches Printful (banque Marque)', () => {
  beforeEach(() => localStorage.clear());

  const oldPrintfulItems = [
    { id: 1, description: 'Créer compte Printful gratuit', phase: 'Phase 1', statut: 'a_faire' },
    { id: 2, description: 'Uploader design rashguard coloris ORIGINAL (Navy/Cyan) sur Printful', phase: 'Phase 1', statut: 'fait' },
    { id: 4, description: 'Ouvrir TikTok Shop et lier Printful', phase: 'Phase 1', statut: 'a_faire' },
  ];

  it('supprime les anciennes tâches seed Printful du stockage', () => {
    localStorage.setItem('fk_marque', JSON.stringify([
      ...oldPrintfulItems,
      { id: 5, description: 'Contacter 3 fournisseurs Alibaba pour gants boxe custom', phase: 'Phase 2', statut: 'a_faire' },
    ]));
    mergeNewSeeds();
    const ids = readMarque().map(i => i.id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(2);
    expect(ids).not.toContain(4);
    expect(ids).toContain(5);
  });

  it('ajoute les nouvelles tâches Phase 1 (1005+) via la fusion seed', () => {
    localStorage.setItem('fk_marque', JSON.stringify(oldPrintfulItems));
    mergeNewSeeds();
    const ids = readMarque().map(i => i.id);
    for (const id of [1005, 1006, 1007, 1008]) expect(ids).toContain(id);
  });

  it('ne touche pas aux items utilisateur, même mentionnant Printful', () => {
    const userItem = { id: 42, description: 'Comparer Printful vs Printify', phase: 'Phase 1', statut: 'a_faire' };
    localStorage.setItem('fk_marque', JSON.stringify([userItem]));
    mergeNewSeeds();
    expect(readMarque().find(i => i.id === 42)).toEqual(userItem);
  });

  it('ne tourne qu\'une fois (idempotent via flag)', () => {
    localStorage.setItem('fk_marque', JSON.stringify(oldPrintfulItems));
    mergeNewSeeds();
    // L'utilisateur recrée volontairement un item id 1 mentionnant Printful :
    // les runs suivants ne doivent plus purger.
    const recreated = [...readMarque(), { id: 1, description: 'Test Printful', statut: 'a_faire' }];
    localStorage.setItem('fk_marque', JSON.stringify(recreated));
    mergeNewSeeds();
    expect(readMarque().some(i => i.id === 1)).toBe(true);
  });

  it('le seed neuf ne contient plus aucune référence Printful', () => {
    expect(marqueInitial.some(i => /printful/i.test(i.description))).toBe(false);
  });
});
