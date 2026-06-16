// Single source of truth for the presentation of the three "banques"
// (content sources): label, accent color, soft background and emoji.
// Consumed by SuggestionCard, Aujourdhui, etc. — keep visual identity here
// rather than duplicating the maps across components.
export const BANQUE_CONFIG = {
  tiktok:     { label: 'TikTok',     color: 'var(--red)',    bg: 'var(--red-50)',      emoji: '🎬' },
  fightfocus: { label: 'FightFocus', color: 'var(--cyan)',   bg: 'var(--cyan-soft)',   emoji: '🌐' },
  marque:     { label: 'Marque',     color: 'var(--orange)', bg: 'var(--orange-soft)', emoji: '👕' },
};

// Accent color for a banque, with a fallback for unknown / project tasks.
export const banqueColor = (banque, fallback = 'var(--red)') =>
  BANQUE_CONFIG[banque]?.color || fallback;
