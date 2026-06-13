/* ════════════════════════════════════════════════════════════════════
   UNLOCKABLES — récompenses & surprises débloquées par paliers
   Deux familles :
   • THEMES  — skins d'accent équipables qui re-colorent toute l'app
               (override de variables CSS au runtime, instantané)
   • TITLES  — titres de combattant cosmétiques affichés dans le HUD
   L'équipement est persisté dans localStorage et diffusé via un event
   custom pour que le HUD et l'écran Récompenses réagissent en direct.
   ════════════════════════════════════════════════════════════════════ */

const THEME_KEY = 'fk_equipped_theme';
const TITLE_KEY = 'fk_equipped_title';
export const COSMETICS_EVENT = 'fk-cosmetics-change';

/* ── Thèmes d'accent ─────────────────────────────────────────────────
   Chaque thème fournit un jeu complet de couleurs d'accent + dégradés.
   `applyTheme` les écrit sur :root → boutons, HUD, FAB, barres XP, glows
   changent d'un coup. La couleur primaire reste lisible avec du texte
   blanc (boutons). */
export const THEMES = [
  {
    id: 'braise', name: 'Braise', desc: 'Le feu d\'origine', unlockLevel: 1,
    swatch: ['#FF5757', '#FF9F1C'],
    vars: {
      '--red': '#FF5757',
      '--red-soft': 'rgba(255,87,87,0.14)',
      '--red-50': 'rgba(255,87,87,0.10)',
      '--grad-fire': 'linear-gradient(135deg, #FF5757 0%, #FF9F1C 100%)',
      '--grad-xp': 'linear-gradient(90deg, #FF9F1C 0%, #FF5757 100%)',
      '--grad-rank': 'linear-gradient(135deg, #7C3AED 0%, #FF5757 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(255,87,87,0.5), 0 4px 12px -2px rgba(255,87,87,0.35)',
      '--glow-violet': '0 0 0 1px rgba(124,58,237,0.4), 0 0 24px -4px rgba(124,58,237,0.5)',
      '--glow-red': '0 0 0 1px rgba(255,87,87,0.35), 0 0 24px -4px rgba(255,87,87,0.45)',
    },
  },
  {
    id: 'acier', name: 'Acier', desc: 'Froid, tranchant, précis', unlockLevel: 4,
    swatch: ['#00B4D8', '#5EE0FF'],
    vars: {
      '--red': '#00B4D8',
      '--red-soft': 'rgba(0,180,216,0.16)',
      '--red-50': 'rgba(0,180,216,0.10)',
      '--grad-fire': 'linear-gradient(135deg, #00B4D8 0%, #5EE0FF 100%)',
      '--grad-xp': 'linear-gradient(90deg, #00B4D8 0%, #5EE0FF 100%)',
      '--grad-rank': 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(0,180,216,0.5), 0 4px 12px -2px rgba(0,180,216,0.35)',
      '--glow-violet': '0 0 0 1px rgba(0,180,216,0.4), 0 0 24px -4px rgba(0,180,216,0.55)',
      '--glow-red': '0 0 0 1px rgba(0,180,216,0.4), 0 0 24px -4px rgba(0,180,216,0.55)',
    },
  },
  {
    id: 'venin', name: 'Venin', desc: 'Toxique et électrique', unlockLevel: 8,
    swatch: ['#7C3AED', '#00B4D8'],
    vars: {
      '--red': '#7C3AED',
      '--red-soft': 'rgba(124,58,237,0.18)',
      '--red-50': 'rgba(124,58,237,0.10)',
      '--grad-fire': 'linear-gradient(135deg, #7C3AED 0%, #00B4D8 100%)',
      '--grad-xp': 'linear-gradient(90deg, #00B4D8 0%, #7C3AED 100%)',
      '--grad-rank': 'linear-gradient(135deg, #7C3AED 0%, #00B4D8 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(124,58,237,0.55), 0 4px 12px -2px rgba(124,58,237,0.4)',
      '--glow-violet': '0 0 0 1px rgba(124,58,237,0.45), 0 0 26px -4px rgba(124,58,237,0.6)',
      '--glow-red': '0 0 0 1px rgba(124,58,237,0.45), 0 0 26px -4px rgba(124,58,237,0.6)',
    },
  },
  {
    id: 'or', name: 'Or massif', desc: 'La couleur des champions', unlockLevel: 14,
    swatch: ['#FFD25A', '#FF9F1C'],
    vars: {
      '--red': '#FFB627',
      '--red-soft': 'rgba(255,182,39,0.16)',
      '--red-50': 'rgba(255,182,39,0.10)',
      '--grad-fire': 'linear-gradient(135deg, #FFD25A 0%, #FF9F1C 100%)',
      '--grad-xp': 'linear-gradient(90deg, #FFD25A 0%, #FF9F1C 100%)',
      '--grad-rank': 'linear-gradient(135deg, #FF9F1C 0%, #FFD25A 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(255,182,39,0.5), 0 4px 12px -2px rgba(255,182,39,0.35)',
      '--glow-violet': '0 0 0 1px rgba(255,182,39,0.4), 0 0 24px -4px rgba(255,182,39,0.55)',
      '--glow-red': '0 0 0 1px rgba(255,182,39,0.4), 0 0 24px -4px rgba(255,182,39,0.55)',
    },
  },
  {
    id: 'carbone', name: 'Carbone', desc: 'Furtif. Premium. Sans bruit.', unlockLevel: 22,
    swatch: ['#94A3B8', '#475569'],
    vars: {
      '--red': '#64748B',
      '--red-soft': 'rgba(148,163,184,0.16)',
      '--red-50': 'rgba(148,163,184,0.08)',
      '--grad-fire': 'linear-gradient(135deg, #C7CDD6 0%, #7B8494 100%)',
      '--grad-xp': 'linear-gradient(90deg, #9AA3B2 0%, #E2E8F0 100%)',
      '--grad-rank': 'linear-gradient(135deg, #475569 0%, #9AA3B2 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(148,163,184,0.4), 0 4px 12px -2px rgba(148,163,184,0.3)',
      '--glow-violet': '0 0 0 1px rgba(148,163,184,0.4), 0 0 24px -4px rgba(148,163,184,0.45)',
      '--glow-red': '0 0 0 1px rgba(148,163,184,0.4), 0 0 24px -4px rgba(148,163,184,0.45)',
    },
  },
  {
    id: 'sang-or', name: 'Sang & Or', desc: 'Prestige absolu', unlockLevel: 32,
    swatch: ['#E11D48', '#FFB627'],
    vars: {
      '--red': '#E11D48',
      '--red-soft': 'rgba(225,29,72,0.16)',
      '--red-50': 'rgba(225,29,72,0.10)',
      '--grad-fire': 'linear-gradient(135deg, #E11D48 0%, #FFB627 100%)',
      '--grad-xp': 'linear-gradient(90deg, #FFB627 0%, #E11D48 100%)',
      '--grad-rank': 'linear-gradient(135deg, #7C1D2E 0%, #FFB627 100%)',
      '--shadow-fab': '0 10px 30px -6px rgba(225,29,72,0.55), 0 4px 12px -2px rgba(225,29,72,0.4)',
      '--glow-violet': '0 0 0 1px rgba(225,29,72,0.45), 0 0 26px -4px rgba(225,29,72,0.6)',
      '--glow-red': '0 0 0 1px rgba(225,29,72,0.45), 0 0 26px -4px rgba(225,29,72,0.6)',
    },
  },
];

/* ── Titres de combattant ────────────────────────────────────────────
   Flair cosmétique. Conditions sur la progression (niveau / série). */
export const TITLES = [
  { id: 'recrue',    name: 'Sang neuf',        desc: 'Le début du chemin',        cond: () => true },
  { id: 'determine', name: 'Le Déterminé',     desc: 'Niveau 3',                  cond: p => p.level >= 3 },
  { id: 'lion',      name: 'Cœur de Lion',     desc: 'Niveau 6',                  cond: p => p.level >= 6 },
  { id: 'lame',      name: 'Lame Aiguisée',    desc: 'Niveau 10',                 cond: p => p.level >= 10 },
  { id: 'sans-repos',name: 'Sans Repos',       desc: '14 victoires d\'affilée',    cond: p => p.bestStreak >= 14 },
  { id: 'spectre',   name: 'Le Spectre',       desc: 'Niveau 15',                 cond: p => p.level >= 15 },
  { id: 'invaincu',  name: 'L\'Invaincu',       desc: '30 victoires d\'affilée',    cond: p => p.bestStreak >= 30 },
  { id: 'legende',   name: 'Légende Vivante',  desc: 'Niveau 30',                 cond: p => p.level >= 30 },
];

/* ── Persistance ─────────────────────────────────────────────────────── */
export function getEquippedThemeId() {
  try { return localStorage.getItem(THEME_KEY) || 'braise'; } catch { return 'braise'; }
}
export function getEquippedTitleId() {
  try { return localStorage.getItem(TITLE_KEY) || 'recrue'; } catch { return 'recrue'; }
}

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function equipTheme(themeId) {
  try { localStorage.setItem(THEME_KEY, themeId); } catch { /* ignore */ }
  applyTheme(themeId);
  window.dispatchEvent(new CustomEvent(COSMETICS_EVENT));
}

export function equipTitle(titleId) {
  try { localStorage.setItem(TITLE_KEY, titleId); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(COSMETICS_EVENT));
}

/** Apply the saved theme on boot (called before React renders to avoid a flash). */
export function applyEquippedTheme() {
  applyTheme(getEquippedThemeId());
}

export function getTitle(titleId) {
  return TITLES.find(t => t.id === titleId) || TITLES[0];
}

/* ── Unlock state for the Rewards screen ─────────────────────────────── */
export function computeUnlocks(prog) {
  return {
    themes: THEMES.map(t => ({ ...t, unlocked: prog.level >= t.unlockLevel })),
    titles: TITLES.map(t => ({ ...t, unlocked: !!t.cond(prog) })),
  };
}

/** Items newly unlocked when crossing from `prevLevel` to `prog.level`
    (level-based only — used for the level-up reveal). */
export function newlyUnlockedByLevel(prevLevel, newLevel) {
  const out = [];
  for (const t of THEMES) {
    if (t.unlockLevel > prevLevel && t.unlockLevel <= newLevel) {
      out.push({ kind: 'Thème', name: t.name, swatch: t.swatch });
    }
  }
  for (const t of TITLES) {
    const lvlMatch = /Niveau (\d+)/.exec(t.desc);
    if (lvlMatch) {
      const lv = parseInt(lvlMatch[1]);
      if (lv > prevLevel && lv <= newLevel) out.push({ kind: 'Titre', name: t.name });
    }
  }
  return out;
}
