// Écriture ponctuelle dans le journal d'un jour, hors composant React
// (testée dans journalLog.test.js). Utilisé par le suivi de prospects
// (« Relancé ✓ » → action bonus) et les actions du Coach (enregistrer une
// séance proposée). L'écran Aujourd'hui relit localStorage à son montage,
// donc les modifications sont visibles dès qu'on revient dessus.

export const emptyJournal = (dateStr) => ({
  date: dateStr,
  taches: [],
  habitudes: { prieres: 0, sport: false, cigarettes: 0, note: '' },
  bonus: [],
  agendaBlocs: [],
});

// Lit (ou crée) le journal du jour, applique `updater` et persiste.
// `updater` reçoit le journal et renvoie le journal modifié — ou null pour
// annuler sans écrire. Renvoie true si une écriture a eu lieu.
export function updateJournal(dateStr, updater) {
  if (!dateStr) return false;
  const key = `fk_journal_${dateStr}`;
  let journal = null;
  try { journal = JSON.parse(localStorage.getItem(key)); } catch { /* entrée corrompue → recréée */ }
  const next = updater(journal || emptyJournal(dateStr));
  if (!next) return false;
  try {
    localStorage.setItem(key, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function addBonusToJournal(dateStr, texte) {
  const t = (texte || '').trim();
  if (!t) return false;
  return updateJournal(dateStr, (j) => ({
    ...j,
    bonus: [...(j.bonus || []), { id: Date.now(), texte: t }],
  }));
}
