// Écriture ponctuelle dans le journal d'un jour, hors composant React
// (testée dans journalLog.test.js). Utilisé par le suivi de prospects :
// « Relancé ✓ » loggue une action bonus du jour (+XP via le moteur existant).
// L'écran Aujourd'hui relit localStorage à son montage, donc la modification
// est visible dès qu'on revient dessus.

const emptyJournal = (dateStr) => ({
  date: dateStr,
  taches: [],
  habitudes: { prieres: 0, sport: false, cigarettes: 0, note: '' },
  bonus: [],
  agendaBlocs: [],
});

export function addBonusToJournal(dateStr, texte) {
  const t = (texte || '').trim();
  if (!dateStr || !t) return false;
  const key = `fk_journal_${dateStr}`;
  let journal = null;
  try { journal = JSON.parse(localStorage.getItem(key)); } catch { /* entrée corrompue → recréée */ }
  if (!journal) journal = emptyJournal(dateStr);
  journal.bonus = [...(journal.bonus || []), { id: Date.now(), texte: t }];
  try {
    localStorage.setItem(key, JSON.stringify(journal));
    return true;
  } catch {
    return false;
  }
}
