// Actions concrètes déclenchées depuis les réponses du Coach (testées dans
// coachActions.test.js). Le coach est invité à terminer certaines réponses
// par un bloc JSON structuré ; on l'extrait ici pour transformer la réponse
// en action dans l'app (enregistrer la séance, ajouter des idées de vidéos).

import { updateJournal } from './journalLog';

function tryParse(str) {
  try {
    const v = JSON.parse(str);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

// Coupe une chaîne commençant par '{' à l'accolade fermante équilibrée.
function balancedJson(str) {
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return str.slice(0, i + 1);
    }
  }
  return str;
}

/**
 * Extrait le bloc JSON structuré d'une réponse du coach.
 * Cherche d'abord un bloc ```json fencé, sinon un objet {"seance"…} /
 * {"idees"…} en fin de texte (le modèle est censé éviter le markdown).
 * @returns {{ text: string, data: ?Object }} texte nettoyé + données parsées.
 */
export function extractStructured(text) {
  if (!text) return { text: '', data: null };
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    const data = tryParse(fence[1].trim());
    if (data) return { text: text.replace(fence[0], '').trim(), data };
  }
  for (const marker of ['{"seance"', '{ "seance"', '{"idees"', '{ "idees"']) {
    const idx = text.lastIndexOf(marker);
    if (idx !== -1) {
      const data = tryParse(balancedJson(text.slice(idx)));
      if (data) return { text: text.slice(0, idx).trim(), data };
    }
  }
  return { text: text.trim(), data: null };
}

// Lieux acceptés du coach → SportType existants (stats/XP inchangés).
const LIEU_TO_TYPE = { exterieur: 'autre', maison: 'maison', salle: 'gym', gym: 'gym', club: 'club' };

/**
 * Normalise `data.seance` en entrée Journal.sport, ou null si invalide.
 * @returns {?import('../types').Sport}
 */
export function parseSeance(data) {
  const s = data?.seance;
  if (!s || typeof s !== 'object') return null;
  const exercices = Array.isArray(s.exercices)
    ? s.exercices
        .filter(e => e && typeof e.nom === 'string' && e.nom.trim())
        .map(e => ({
          nom: e.nom.trim(),
          series: Number(e.series) || null,
          reps: e.reps != null ? String(e.reps).trim() : null,
          charge: e.charge != null ? String(e.charge).trim() : null,
        }))
    : [];
  const duree = Number(s.duree) || 0;
  if (!exercices.length && !duree) return null;
  const lieu = typeof s.lieu === 'string' && LIEU_TO_TYPE[s.lieu] ? s.lieu : 'exterieur';
  return {
    type: LIEU_TO_TYPE[lieu],
    lieu,
    duree_reelle: duree,
    seance_nom: (typeof s.titre === 'string' && s.titre.trim()) || 'Séance du coach',
    materiel: Array.isArray(s.materiel) ? s.materiel.filter(m => typeof m === 'string' && m.trim()) : [],
    exercices,
    notes: 'Proposée par le coach',
  };
}

/** Idées de vidéos proposées (max 5 titres non vides), ou null. */
export function parseIdees(data) {
  if (!Array.isArray(data?.idees)) return null;
  const idees = data.idees.filter(i => typeof i === 'string' && i.trim()).map(i => i.trim()).slice(0, 5);
  return idees.length ? idees : null;
}

/**
 * Enregistre la séance du coach comme sport du jour — refuse si une séance
 * est déjà loguée ce jour-là (ne jamais écraser une vraie séance).
 * @returns {boolean} true si enregistrée.
 */
export function saveSeanceToJournal(dateStr, sportEntry) {
  if (!sportEntry) return false;
  return updateJournal(dateStr, (j) => {
    if (j.sport) return null; // séance existante → on n'écrase pas
    return {
      ...j,
      sport: sportEntry,
      habitudes: { ...(j.habitudes || {}), sport: true },
    };
  });
}
