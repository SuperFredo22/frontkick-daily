import { formatDate } from './date';

/* ════════════════════════════════════════════════════════════════════
   GAMIFICATION ENGINE — "Combat Game"
   Turns the existing daily journal into combatant progression:
   XP, niveau, grade, série de victoires (win streak) and badges.
   Everything is derived from data already stored in localStorage,
   so progression works retroactively over the full history.
   ════════════════════════════════════════════════════════════════════ */

/* ── XP rewards per action ──────────────────────────────────────────── */
export const XP = {
  mission:   20,  // a mission completed (tâche "fait")
  bonus:     10,  // a bonus action
  training:  50,  // a training session (sport) — the heavy hitter
  priere:     5,  // each prayer
  smokeFree: 15,  // a full smoke-free day
  victoryDay: 25, // bonus for "winning" a day (≥1 mission or training)
};

/* ── Level curve ─────────────────────────────────────────────────────
   XP required to GO FROM level n to n+1 grows steadily.
   level 1→2 : 120 · then +90 per level. Smooth, never punishing. */
function xpToReach(level) {
  // total cumulative XP needed to be AT `level` (level 1 = 0)
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += 120 + (l - 1) * 90;
  return total;
}

export function levelFromXP(totalXP) {
  let level = 1;
  while (xpToReach(level + 1) <= totalXP) level++;
  const floor = xpToReach(level);
  const ceil = xpToReach(level + 1);
  const into = totalXP - floor;
  const span = ceil - floor;
  return {
    level,
    intoLevel: into,        // XP earned within the current level
    levelSpan: span,        // XP needed to clear the current level
    toNext: span - into,    // XP remaining to next level
    progress: span > 0 ? Math.min(1, into / span) : 1,
  };
}

/* ── Combat ranks (grade) by level band ─────────────────────────────── */
export const RANKS = [
  { min: 1,  name: 'Recrue',     color: 'var(--ink-2)' },
  { min: 3,  name: 'Amateur',    color: 'var(--cyan)' },
  { min: 6,  name: 'Challenger', color: 'var(--cyan)' },
  { min: 10, name: 'Contender',  color: 'var(--orange)' },
  { min: 16, name: 'Vétéran',    color: 'var(--orange)' },
  { min: 24, name: 'Élite',      color: 'var(--red)' },
  { min: 34, name: 'Maître',     color: 'var(--violet)' },
  { min: 50, name: 'Champion',   color: 'var(--violet)' },
];

export function rankForLevel(level) {
  let rank = RANKS[0];
  for (const r of RANKS) if (level >= r.min) rank = r;
  return rank;
}

/* ── Read all journals from localStorage ─────────────────────────────
   Keys look like `fk_journal_YYYY-MM-DD`. */
function readAllJournals() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('fk_journal_')) continue;
      const date = key.slice('fk_journal_'.length);
      try {
        const j = JSON.parse(localStorage.getItem(key));
        if (j) out.push({ date, ...j });
      } catch { /* skip bad entry */ }
    }
  } catch { /* localStorage unavailable */ }
  out.sort((a, b) => (a.date < b.date ? -1 : 1));
  return out;
}

/* ── Aggregate stats over the whole history ─────────────────────────── */
export function computeStats() {
  const journals = readAllJournals();

  let missions = 0, bonus = 0, training = 0, prieres = 0, smokeFreeDays = 0;
  let trackedDays = 0, victoryDays = 0;
  const trainingByType = { club: 0, gym: 0, maison: 0, autre: 0 };

  for (const j of journals) {
    trackedDays++;
    const done = (j.taches || []).filter(t => t.statut === 'fait').length;
    missions += done;
    bonus += (j.bonus || []).length;
    prieres += j.habitudes?.prieres || 0;

    const sport = j.sport;
    const hasTraining = !!(sport || j.habitudes?.sport);
    if (hasTraining) {
      training++;
      const type = sport?.type;
      if (type && trainingByType[type] != null) trainingByType[type]++;
      else trainingByType.autre++;
    }

    if ((j.habitudes?.cigarettes || 0) === 0) smokeFreeDays++;
    if (done > 0 || hasTraining) victoryDays++;
  }

  const totalXP =
    missions * XP.mission +
    bonus * XP.bonus +
    training * XP.training +
    prieres * XP.priere +
    smokeFreeDays * XP.smokeFree +
    victoryDays * XP.victoryDay;

  return {
    missions, bonus, training, prieres, smokeFreeDays,
    trackedDays, victoryDays, trainingByType, totalXP,
    ...computeWinStreak(),
  };
}

/* ── Win streak — consecutive "victory days" up to today ─────────────
   A victory day = ≥1 mission done OR a training session. */
export function computeWinStreak() {
  const get = (d) => {
    try { return JSON.parse(localStorage.getItem(`fk_journal_${formatDate(d)}`)); }
    catch { return null; }
  };
  const isVictory = (j) =>
    !!j && ((j.taches || []).some(t => t.statut === 'fait') || j.sport || j.habitudes?.sport);

  // Current streak (allow today to be still in progress: don't break on an
  // empty *today*, only start counting from the most recent victory).
  let current = 0;
  const start = new Date();
  for (let i = 0; i < 730; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    if (isVictory(get(d))) current++;
    else if (i > 0) break; // today may be empty; yesterday onward must be unbroken
  }

  // Best streak across history
  let best = 0, run = 0;
  for (let i = 729; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    if (isVictory(get(d))) { run++; best = Math.max(best, run); }
    else run = 0;
  }

  return { winStreak: current, bestStreak: Math.max(best, current) };
}

/* ── Badges ──────────────────────────────────────────────────────────
   Each badge: id, name, desc, icon (lucide name), color, a target value
   and a selector that pulls the current value from stats. Progress and
   unlocked state are derived. */
export const BADGES = [
  { id: 'first_strike', name: 'Première frappe', desc: 'Termine ta 1ʳᵉ mission',        icon: 'Swords',    color: 'var(--red)',    target: 1,   stat: s => s.missions },
  { id: 'fighter',      name: 'Combattant',      desc: '25 missions accomplies',         icon: 'Target',    color: 'var(--red)',    target: 25,  stat: s => s.missions },
  { id: 'warmachine',   name: 'Machine de guerre', desc: '150 missions accomplies',      icon: 'Crosshair', color: 'var(--violet)', target: 150, stat: s => s.missions },
  { id: 'iron_will',    name: 'Volonté de fer',  desc: '7 victoires d\'affilée',          icon: 'Flame',     color: 'var(--orange)', target: 7,   stat: s => s.bestStreak },
  { id: 'unbeaten',     name: 'Invaincu',        desc: '30 victoires d\'affilée',         icon: 'Shield',    color: 'var(--orange)', target: 30,  stat: s => s.bestStreak },
  { id: 'sparring',     name: 'Sparring',        desc: '10 entraînements',                icon: 'Dumbbell',  color: 'var(--cyan)',   target: 10,  stat: s => s.training },
  { id: 'conditioned',  name: 'Condition physique', desc: '50 entraînements',            icon: 'Activity',  color: 'var(--cyan)',   target: 50,  stat: s => s.training },
  { id: 'clean_lungs',  name: 'Poumons neufs',   desc: '14 jours sans cigarette',         icon: 'Wind',      color: 'var(--green)',  target: 14,  stat: s => s.smokeFreeDays },
  { id: 'devotion',     name: 'Dévotion',        desc: '100 prières',                     icon: 'Heart',     color: 'var(--violet)', target: 100, stat: s => s.prieres },
  { id: 'veteran',      name: 'Vétéran',         desc: 'Atteins le niveau 16',            icon: 'Star',      color: 'var(--orange)', target: 16,  stat: s => s.level },
  { id: 'champion',     name: 'Champion',        desc: 'Atteins le niveau 50',            icon: 'Crown',     color: 'var(--violet)', target: 50,  stat: s => s.level },
];

export function computeBadges(stats) {
  const withLevel = { ...stats, level: levelFromXP(stats.totalXP).level };
  return BADGES.map(b => {
    const value = b.stat(withLevel) || 0;
    return {
      ...b,
      value,
      progress: Math.min(1, value / b.target),
      unlocked: value >= b.target,
    };
  });
}

/* ── One-shot snapshot for the UI ───────────────────────────────────── */
export function getProgression() {
  const stats = computeStats();
  const lvl = levelFromXP(stats.totalXP);
  const rank = rankForLevel(lvl.level);
  const badges = computeBadges(stats);
  return {
    ...stats,
    ...lvl,
    rank,
    badges,
    badgesUnlocked: badges.filter(b => b.unlocked).length,
  };
}
