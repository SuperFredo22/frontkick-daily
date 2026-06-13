import { collectData, LAST_EXPORT_KEY } from './backup';
import { getStorage } from '../hooks/useStorage';
import { formatDate } from './date';

// Clés à ne jamais envoyer en ligne
const SENSITIVE_KEYS = ['fk_perplexity_key', 'fk_pin'];

// Secret partagé embarqué au build (doit correspondre à BACKUP_SECRET sur Vercel)
const BACKUP_SECRET = import.meta.env.VITE_BACKUP_SECRET || '';

const THROTTLE_MS = 5 * 60 * 1000;
let lastSync = 0;

export function isAutoBackupEnabled() {
  return getStorage('autobackup') === true && !!BACKUP_SECRET;
}

function buildPayload() {
  const journal = getStorage(`journal_${formatDate(new Date())}`) || {};
  const state = {
    date:         formatDate(new Date()),
    prieres:      journal?.habitudes?.prieres || 0,
    cigarettes:   journal?.habitudes?.cigarettes || 0,
    sport:        !!(journal?.sport || journal?.habitudes?.sport),
    tachesFaites: (journal?.taches || []).filter(t => t.statut === 'fait').length,
    hasNote:      !!journal?.habitudes?.note?.trim(),
  };
  const full = collectData();
  SENSITIVE_KEYS.forEach(k => delete full[k]);
  return { state, full, secret: BACKUP_SECRET };
}

function markSynced() {
  try { localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString()); } catch { /* quota */ }
}

// Synchro classique (au lancement, périodique)
export async function syncBackup({ force = false } = {}) {
  if (!isAutoBackupEnabled()) return false;
  if (!force && Date.now() - lastSync < THROTTLE_MS) return false;
  lastSync = Date.now();
  try {
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-backup-secret': BACKUP_SECRET },
      body: JSON.stringify(buildPayload()),
    });
    if (res.ok) { markSynced(); return true; }
  } catch { /* offline : on réessaiera */ }
  return false;
}

// À la mise en arrière-plan : sendBeacon survit à la fermeture de la page,
// contrairement à fetch
export function syncBackupOnHide() {
  if (!isAutoBackupEnabled()) return;
  try {
    const blob = new Blob([JSON.stringify(buildPayload())], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/backup', blob)) {
      lastSync = Date.now();
      markSynced();
    }
  } catch { /* beacon indisponible */ }
}
