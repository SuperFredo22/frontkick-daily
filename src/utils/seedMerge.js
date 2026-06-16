import { tiktokInitial } from '../data/tiktok';
import { marqueInitial } from '../data/marque';

// Seed items shipped after the first release use IDs >= this threshold so they
// never collide with user-created items (which auto-increment from the original
// 1–25 range).
const SEED_THRESHOLD = 1000;

/**
 * Merge newly-shipped seed items into a banque already saved in localStorage,
 * without resurrecting items the user deleted or creating duplicates.
 *
 * Safety model:
 * - Fresh users (no stored bank) are skipped — useStorage seeds the full list.
 * - `<key>_seeded` records which seed IDs have already been offered. On the
 *   very first run (key absent) the baseline is every "original" seed ID
 *   (< SEED_THRESHOLD), so deletions of original items are never undone — only
 *   the new high-ID items get added.
 * - Items already present (matched by ID) are never duplicated.
 */
function mergeBankSeed(key, seed) {
  const storeKey = `fk_${key}`;
  const seededKey = `fk_${key}_seeded`;

  let stored;
  try { stored = JSON.parse(localStorage.getItem(storeKey)); } catch { return; }
  if (!Array.isArray(stored)) return; // fresh user → full seed handled by useStorage

  let seeded;
  try { seeded = JSON.parse(localStorage.getItem(seededKey)); } catch { seeded = null; }
  if (!Array.isArray(seeded)) {
    // First run of the merge system: treat every original seed item as already
    // known so a user's earlier deletions of them are respected.
    seeded = seed.filter(i => i.id < SEED_THRESHOLD).map(i => i.id);
  }

  const seededSet = new Set(seeded);
  const storedIds = new Set(stored.map(i => i.id));
  const additions = seed.filter(i => !seededSet.has(i.id) && !storedIds.has(i.id));

  if (additions.length) {
    try { localStorage.setItem(storeKey, JSON.stringify([...stored, ...additions])); }
    catch { /* ignore quota errors */ }
  }

  const allSeeded = [...new Set([...seeded, ...seed.map(i => i.id)])];
  try { localStorage.setItem(seededKey, JSON.stringify(allSeeded)); }
  catch { /* ignore */ }
}

// One-time migration: attach automatic tracking to the original seed jalons
// (#1 « vidéos ce mois », #3 « entraînements ce trimestre ») for users who
// already had them stored as manual counters. Runs once, then never again.
function migrateJalonSources() {
  const FLAG = 'fk_jalons_src_migrated';
  if (localStorage.getItem(FLAG)) return;
  const SOURCE_BY_ID = { 1: 'videos_mois', 3: 'seances_trim' };
  let jalons;
  try { jalons = JSON.parse(localStorage.getItem('fk_jalons')); } catch { jalons = null; }
  if (Array.isArray(jalons)) {
    let changed = false;
    const next = jalons.map(j => {
      if (!j.source && SOURCE_BY_ID[j.id]) { changed = true; return { ...j, source: SOURCE_BY_ID[j.id] }; }
      return j;
    });
    if (changed) {
      try { localStorage.setItem('fk_jalons', JSON.stringify(next)); } catch { /* ignore */ }
    }
  }
  try { localStorage.setItem(FLAG, '1'); } catch { /* ignore */ }
}

/** Run all banque seed merges + migrations. Safe to call once at startup. */
export function mergeNewSeeds() {
  try {
    if (typeof localStorage === 'undefined') return;
    mergeBankSeed('tiktok', tiktokInitial);
    mergeBankSeed('marque', marqueInitial);
    migrateJalonSources();
  } catch { /* localStorage unavailable */ }
}
