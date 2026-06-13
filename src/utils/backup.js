// Export / sauvegarde des données locales (toutes les clés fk_*)

export const LAST_EXPORT_KEY = 'fk_last_export';

export function collectData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('fk_')) data[key] = localStorage.getItem(key);
  }
  return data;
}

export function triggerDownload(json, filename) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exporte tout en JSON ; retourne le nombre d'entrées exportées
export function exportAllData() {
  const data = collectData();
  const count = Object.keys(data).length;
  if (count === 0) return 0;
  const date = new Date().toISOString().split('T')[0];
  triggerDownload(JSON.stringify(data, null, 2), `frontkick-backup-${date}.json`);
  try { localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString()); } catch { /* quota */ }
  return count;
}

// Nombre de jours depuis la dernière sauvegarde (export manuel ou auto-backup) ;
// null si aucune sauvegarde n'a jamais été faite
export function daysSinceLastBackup() {
  try {
    const last = localStorage.getItem(LAST_EXPORT_KEY);
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  } catch { return null; }
}
