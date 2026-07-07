// Historique des exercices des séances libres (testé dans sportHistory.test.js).
// Balaye les journaux localStorage (fk_journal_*) comme utils/gamification —
// volumes faibles, pas de cache nécessaire.

const norm = (s) => (s || '').trim().toLowerCase();

/**
 * Dernière fois qu'un exercice a été enregistré dans une séance.
 * @param {string} nom            Nom saisi (comparaison insensible à la casse).
 * @param {string} [excludeDate]  'YYYY-MM-DD' à ignorer (le jour en cours de saisie).
 * @returns {?{date: string, exercice: import('../types').SportExercice}}
 */
export function lastExerciseEntry(nom, excludeDate) {
  const target = norm(nom);
  if (!target) return null;
  let best = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('fk_journal_')) continue;
      const date = key.slice('fk_journal_'.length);
      if (date === excludeDate) continue;
      let j = null;
      try { j = JSON.parse(localStorage.getItem(key)); } catch { continue; }
      const exos = j?.sport?.exercices;
      if (!Array.isArray(exos)) continue;
      const found = exos.find(e => norm(e.nom) === target);
      if (found && (!best || date > best.date)) best = { date, exercice: found };
    }
  } catch { /* localStorage indisponible */ }
  return best;
}

// Résumé affichable d'un exercice historisé : '4 × 8 · bande 25 kg'.
export function exerciseSummary(exercice) {
  if (!exercice) return '';
  const parts = [];
  if (exercice.series) parts.push(`${exercice.series} × ${exercice.reps || '?'}`);
  else if (exercice.reps) parts.push(exercice.reps);
  if (exercice.charge) parts.push(exercice.charge);
  return parts.join(' · ');
}
