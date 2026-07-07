// Horaires de travail — logique pure (testée dans travail.test.js).
//
// Persisté sous `fk_travail` :
//   {
//     horaires:   { '1': { debut: '09:00', fin: '17:00' }, ... },  // semaine type
//     exceptions: { 'YYYY-MM-DD': { debut, fin } | null, ... },    // null = repos ce jour-là
//   }
// Les clés d'`horaires` sont les jours JS (0 = dimanche … 6 = samedi).

export const EMPTY_TRAVAIL = { horaires: {}, exceptions: {} };

// Ordre d'affichage français (lundi en premier).
export const JOURS_SEMAINE = [
  { key: '1', label: 'Lundi',    short: 'Lun' },
  { key: '2', label: 'Mardi',    short: 'Mar' },
  { key: '3', label: 'Mercredi', short: 'Mer' },
  { key: '4', label: 'Jeudi',    short: 'Jeu' },
  { key: '5', label: 'Vendredi', short: 'Ven' },
  { key: '6', label: 'Samedi',   short: 'Sam' },
  { key: '0', label: 'Dimanche', short: 'Dim' },
];

// Le schedule est-il renseigné (au moins un jour type ou une exception) ?
export function hasWorkSchedule(travail) {
  if (!travail) return false;
  return Object.keys(travail.horaires || {}).length > 0
    || Object.keys(travail.exceptions || {}).length > 0;
}

// Bloc de travail effectif pour une date 'YYYY-MM-DD' : l'exception du jour
// prime (null = repos exceptionnel), sinon l'horaire de la semaine type.
// Renvoie { debut, fin, exception? } ou null (pas de travail ce jour).
export function workBlockForDate(travail, dateStr) {
  if (!travail || !dateStr) return null;
  const exceptions = travail.exceptions || {};
  if (Object.prototype.hasOwnProperty.call(exceptions, dateStr)) {
    const ex = exceptions[dateStr];
    return ex && ex.debut && ex.fin ? { ...ex, exception: true } : null;
  }
  // 'T12:00:00' force l'interprétation en heure locale (une date nue serait UTC).
  const day = String(new Date(`${dateStr}T12:00:00`).getDay());
  const h = (travail.horaires || {})[day];
  return h && h.debut && h.fin ? { ...h } : null;
}

// Durée en heures entre deux 'HH:MM' (0 si incohérent).
export function hoursBetween(debut, fin) {
  if (!debut || !fin) return 0;
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
}

// Total d'heures de travail prévues sur une liste de dates 'YYYY-MM-DD'.
export function totalWorkHours(travail, dateStrs) {
  return (dateStrs || []).reduce((sum, ds) => {
    const b = workBlockForDate(travail, ds);
    return b ? sum + hoursBetween(b.debut, b.fin) : sum;
  }, 0);
}

// Heures de travail du mois de `ref` : `done` = jours écoulés (≤ ref),
// `planned` = mois entier, exceptions comprises.
export function monthWorkHours(travail, ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let done = 0, planned = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const b = workBlockForDate(travail, ds);
    if (!b) continue;
    const h = hoursBetween(b.debut, b.fin);
    planned += h;
    if (d <= ref.getDate()) done += h;
  }
  return { done, planned };
}

// 7.5 → '7h30', 8 → '8h'
export function formatHeures(n) {
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}
