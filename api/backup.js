import { put } from '@vercel/blob';

// Reçoit depuis l'app (opt-in dans les réglages) :
// - state : résumé minimal du jour → utilisé par /api/cron pour les
//   notifications intelligentes (skip des rappels déjà accomplis)
// - full  : export complet des données (hors clés sensibles, filtrées côté
//   client) → filet de sécurité contre la perte du localStorage.
//   Rotation par jour de la semaine = 7 sauvegardes glissantes.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { state, full } = req.body || {};
    const blobOpts = {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    };

    let savedState = false, savedFull = false;

    if (state?.date && typeof state === 'object') {
      await put('daily-state.json', JSON.stringify(state), blobOpts);
      savedState = true;
    }

    if (full && typeof full === 'object' && Object.keys(full).length > 0) {
      const weekday = new Date()
        .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Paris' })
        .toLowerCase();
      await put(`backups/${weekday}.json`, JSON.stringify(full), blobOpts);
      savedFull = true;
    }

    res.status(200).json({ ok: true, savedState, savedFull });
  } catch (e) {
    console.error('Backup error:', e);
    res.status(500).json({ error: e.message });
  }
}
