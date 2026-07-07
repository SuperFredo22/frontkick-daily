import { describe, it, expect, beforeEach } from 'vitest';
import { extractStructured, parseSeance, parseIdees, saveSeanceToJournal } from './coachActions';

beforeEach(() => localStorage.clear());

const SEANCE_JSON = '{"seance": {"titre": "Tractions + bandes", "lieu": "exterieur", "duree": 30, "materiel": ["Barre de traction"], "exercices": [{"nom": "Tractions", "series": 4, "reps": "8", "charge": "bande 25 kg"}]}}';

describe('extractStructured', () => {
  it('extrait un bloc ```json fencé et nettoie le texte', () => {
    const { text, data } = extractStructured(`Voici ta séance.\n\n\`\`\`json\n${SEANCE_JSON}\n\`\`\``);
    expect(text).toBe('Voici ta séance.');
    expect(data.seance.titre).toBe('Tractions + bandes');
  });

  it('retombe sur un objet JSON nu en fin de texte (modèle sans markdown)', () => {
    const { text, data } = extractStructured(`Séance du jour, 30 minutes dehors.\n${SEANCE_JSON}`);
    expect(text).toBe('Séance du jour, 30 minutes dehors.');
    expect(data.seance.exercices).toHaveLength(1);
  });

  it('gère les accolades dans les chaînes du JSON', () => {
    const tricky = '{"idees": ["Pourquoi {le clinch} est sous-coté", "Idée 2"]}';
    const { data } = extractStructured(`Deux idées.\n${tricky}`);
    expect(data.idees).toHaveLength(2);
  });

  it('renvoie data null pour du texte sans bloc structuré', () => {
    const { text, data } = extractStructured('Simple conseil sans JSON.');
    expect(text).toBe('Simple conseil sans JSON.');
    expect(data).toBeNull();
  });
});

describe('parseSeance', () => {
  it('normalise en entrée Journal.sport avec type dérivé du lieu', () => {
    const s = parseSeance(JSON.parse(SEANCE_JSON));
    expect(s.type).toBe('autre'); // exterieur → autre
    expect(s.duree_reelle).toBe(30);
    expect(s.exercices[0]).toEqual({ nom: 'Tractions', series: 4, reps: '8', charge: 'bande 25 kg' });
  });

  it('rejette une séance sans exercices ni durée, ou absente', () => {
    expect(parseSeance({ seance: { titre: 'Vide' } })).toBeNull();
    expect(parseSeance({ idees: ['x'] })).toBeNull();
    expect(parseSeance(null)).toBeNull();
  });

  it('tolère un lieu inconnu (retombe sur extérieur/autre)', () => {
    const s = parseSeance({ seance: { lieu: 'lune', duree: 20, exercices: [] } });
    expect(s.lieu).toBe('exterieur');
    expect(s.type).toBe('autre');
  });
});

describe('parseIdees', () => {
  it('filtre les entrées vides et limite à 5', () => {
    expect(parseIdees({ idees: ['a', '', 'b', 'c', 'd', 'e', 'f'] })).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('renvoie null sans idées exploitables', () => {
    expect(parseIdees({ idees: [] })).toBeNull();
    expect(parseIdees({ seance: {} })).toBeNull();
  });
});

describe('saveSeanceToJournal', () => {
  const entry = { type: 'autre', duree_reelle: 30, seance_nom: 'Test', materiel: [], exercices: [], notes: '' };

  it('enregistre la séance et marque le sport fait', () => {
    expect(saveSeanceToJournal('2026-07-07', entry)).toBe(true);
    const j = JSON.parse(localStorage.getItem('fk_journal_2026-07-07'));
    expect(j.sport.seance_nom).toBe('Test');
    expect(j.habitudes.sport).toBe(true);
  });

  it("refuse d'écraser une séance déjà loguée", () => {
    localStorage.setItem('fk_journal_2026-07-07', JSON.stringify({
      date: '2026-07-07', sport: { type: 'club', seance_nom: 'Vraie séance' },
      habitudes: { sport: true },
    }));
    expect(saveSeanceToJournal('2026-07-07', entry)).toBe(false);
    const j = JSON.parse(localStorage.getItem('fk_journal_2026-07-07'));
    expect(j.sport.seance_nom).toBe('Vraie séance');
  });
});
