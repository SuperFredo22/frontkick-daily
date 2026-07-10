// Revue hebdomadaire automatique (testée dans revueHebdo.test.js).
// Collecte les données d'une semaine (lun→dim) depuis les journaux
// localStorage, construit le prompt d'analyse et gère la persistance des
// revues générées (`fk_revues_hebdo`). La génération elle-même (appel API)
// vit dans components/RevueHebdo.jsx.

import { formatDate, addDays, startOfWeek } from './date';
import { dayXP } from './gamification';
import { totalWorkHours, formatHeures } from './travail';

const REVUES_KEY = 'fk_revues_hebdo';
const MAX_REVUES = 12;

// Lundi de la dernière semaine COMPLÈTE (la semaine en cours ne compte pas).
export function lastCompletedWeekStart(now = new Date()) {
  return formatDate(addDays(startOfWeek(now), -7));
}

function readJournal(ds) {
  try { return JSON.parse(localStorage.getItem(`fk_journal_${ds}`)); }
  catch { return null; }
}

function readLS(key) {
  try { return JSON.parse(localStorage.getItem(`fk_${key}`) || 'null'); } catch { return null; }
}

// Agrège les 7 jours d'une semaine en un résumé chiffré.
export function collectWeekData(weekStartStr) {
  const base = new Date(`${weekStartStr}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => {
    const ds = formatDate(addDays(base, i));
    return { ds, journal: readJournal(ds) };
  });

  let xp = 0, missions = 0, prieres = 0, cigarettes = 0, joursSansClope = 0;
  let minutesSport = 0, videos = 0, daysWithData = 0;
  const seances = [];
  const relances = [];
  const notes = [];

  for (const { ds, journal: j } of days) {
    if (!j) continue;
    daysWithData++;
    xp += dayXP(j);
    missions += (j.taches || []).filter(t => t.statut === 'fait').length;
    videos += (j.taches || []).filter(t => t.statut === 'fait' && t.banque === 'tiktok').length;
    prieres += j.habitudes?.prieres || 0;
    const cigs = j.habitudes?.cigarettes || 0;
    cigarettes += cigs;
    if (cigs === 0) joursSansClope++;
    if (j.sport || j.habitudes?.sport) {
      const s = j.sport || {};
      minutesSport += s.duree_reelle || 0;
      seances.push({
        date: ds,
        nom: s.seance_nom || s.notes || s.type || 'Séance',
        duree: s.duree_reelle || 0,
        exos: (s.exercices || []).length,
      });
    }
    for (const b of j.bonus || []) {
      const t = b.texte || '';
      if (t.startsWith('📇')) relances.push(t.replace('📇 ', ''));
    }
    if (j.habitudes?.note?.trim()) notes.push({ date: ds, text: j.habitudes.note.trim() });
  }

  const travail = readLS('travail');
  const heuresTravail = travail ? totalWorkHours(travail, days.map(d => d.ds)) : 0;

  return {
    weekStart: weekStartStr,
    daysWithData, xp, missions, videos, prieres, cigarettes, joursSansClope,
    seances, minutesSport, relances, notes, heuresTravail,
  };
}

// Prompt de génération : données de la semaine + comparaison à la précédente.
export function buildRevuePrompt(data, prev) {
  const delta = (a, b) => {
    const d = a - b;
    return d === 0 ? '=' : d > 0 ? `+${d}` : `${d}`;
  };
  const cmp = prev && prev.daysWithData > 0;

  const lines = [
    `Semaine du ${data.weekStart} (${data.daysWithData} jours renseignés) :`,
    `- XP : ${data.xp}${cmp ? ` (${delta(data.xp, prev.xp)} vs semaine précédente)` : ''}`,
    `- Missions accomplies : ${data.missions}${cmp ? ` (${delta(data.missions, prev.missions)})` : ''} dont ${data.videos} vidéo(s) TikTok`,
    `- Sport : ${data.seances.length} séance(s)${cmp ? ` (${delta(data.seances.length, prev.seances.length)})` : ''}, ${data.minutesSport} min au total`,
    ...data.seances.map(s => `    • ${s.date} : ${s.nom}${s.duree ? ` (${s.duree} min)` : ''}${s.exos ? `, ${s.exos} exercices` : ''}`),
    `- Prières : ${data.prieres}${cmp ? ` (${delta(data.prieres, prev.prieres)})` : ''}`,
    `- Cigarettes : ${data.cigarettes}${cmp ? ` (${delta(data.cigarettes, prev.cigarettes)})` : ''} | jours sans clope : ${data.joursSansClope}/7`,
    data.relances.length ? `- Relances prospects effectuées : ${data.relances.join(' ; ')}` : null,
    data.heuresTravail > 0 ? `- Heures de travail prévues : ${formatHeures(data.heuresTravail)}` : null,
    ...(data.notes.length ? ['Notes de la semaine :', ...data.notes.map(n => `    • ${n.date} : "${n.text}"`)] : []),
  ].filter(Boolean);

  return {
    system: "Tu rédiges la revue hebdomadaire personnelle d'un pratiquant d'arts martiaux (MMA), créateur de contenu TikTok combat, salarié, qui suit aussi des prospects business. Français, texte brut sans aucun markdown (zéro **, #, tirets de liste). Trois courts paragraphes séparés par une ligne vide : 1) le bilan — ce qui ressort vraiment de la semaine, 2) la vigilance — ce qui décroche, dit franchement mais sans moraliser, 3) trois objectifs concrets et mesurables pour la semaine qui commence, en une phrase chacun. 180 mots maximum. Ton direct et humain, comme un ami lucide. Appuie-toi uniquement sur les données fournies.",
    user: lines.join('\n'),
  };
}

// ── Persistance des revues ────────────────────────────────────────────────

export function getRevues() {
  try { return JSON.parse(localStorage.getItem(REVUES_KEY) || '[]'); }
  catch { return []; }
}

export function saveRevue(weekStart, texte) {
  const others = getRevues().filter(r => r.weekStart !== weekStart);
  others.unshift({ weekStart, texte, generatedAt: Date.now() });
  others.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  try { localStorage.setItem(REVUES_KEY, JSON.stringify(others.slice(0, MAX_REVUES))); } catch { /* plein */ }
}

// Garde-fou anti-boucle : une tentative de génération auto max toutes les 10 min
// (évite de marteler l'API si elle est en erreur à chaque ouverture des Stats).
const ATTEMPT_KEY = 'fk_revue_attempt';

export function canAutoAttempt(now = Date.now()) {
  const last = Number(localStorage.getItem(ATTEMPT_KEY) || 0);
  return now - last > 10 * 60 * 1000;
}

export function markAttempt(now = Date.now()) {
  try { localStorage.setItem(ATTEMPT_KEY, String(now)); } catch { /* ignore */ }
}
