// Suivi de prospects (CRM léger) — logique pure (testée dans prospects.test.js).
// Les prospects sont persistés sous `fk_prospects` (voir types.js → Prospect).

export const PROSPECT_STATUTS = [
  { key: 'a_contacter', label: 'À contacter', color: 'var(--cyan)',   soft: 'var(--cyan-soft)' },
  { key: 'contacte',    label: 'Contacté',    color: 'var(--orange)', soft: 'var(--orange-soft)' },
  { key: 'relance',     label: 'À relancer',  color: 'var(--red)',    soft: 'var(--red-soft)' },
  { key: 'gagne',       label: 'Gagné',       color: 'var(--green)',  soft: 'var(--green-soft)' },
  { key: 'perdu',       label: 'Perdu',       color: 'var(--ink-3)',  soft: 'var(--line-2)' },
];

export function statutConfig(key) {
  return PROSPECT_STATUTS.find(s => s.key === key) || PROSPECT_STATUTS[0];
}

// Un prospect « ouvert » est encore en jeu (ni gagné ni perdu).
export function isOpenProspect(p) {
  return p.statut !== 'gagne' && p.statut !== 'perdu';
}

// Prospects ouverts dont la relance est due (date de relance ≤ aujourd'hui).
export function dueProspects(prospects, todayStr) {
  return (prospects || []).filter(
    p => isOpenProspect(p) && p.relanceDate && p.relanceDate <= todayStr
  );
}

// Tri d'affichage : relances dues d'abord (la plus ancienne en premier),
// puis les autres ouverts, puis les clos — chacun du plus récent au plus ancien.
export function sortProspects(prospects, todayStr) {
  const rank = (p) => {
    if (isOpenProspect(p) && p.relanceDate && p.relanceDate <= todayStr) return 0;
    return isOpenProspect(p) ? 1 : 2;
  };
  return [...(prospects || [])].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return (a.relanceDate || '').localeCompare(b.relanceDate || '');
    return (b.creeLe || 0) - (a.creeLe || 0);
  });
}
