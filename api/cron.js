import { list, del } from '@vercel/blob';
import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const NOTIFICATIONS = {
  'morning-prayer': {
    title: '🙏 Prières du matin',
    body: 'Commence ta journée du bon pied — 2 minutes pour tes prières.',
    url: '/?page=today',
  },
  'first-task': {
    title: '✅ Première tâche du jour',
    body: "C'est l'heure d'attaquer — ouvre Frontkick et choisis ta priorité.",
    url: '/?page=today',
  },
  'midday': {
    title: '☀️ Bilan mi-journée',
    body: 'Prières ✓ ? Tâches ? Sport prévu ? Consulte ton coach pour un point rapide.',
    url: '/?page=coach',
  },
  'afternoon': {
    title: '⚡ Focus après-midi',
    body: "L'après-midi commence — reste concentré sur ta priorité du jour.",
    url: '/?page=today',
  },
  'sport': {
    title: '🥊 C\'est l\'heure du sport',
    body: "Tu as prévu une séance aujourd'hui ? Lance-toi — ça change tout.",
    url: '/?page=today&open=sport',
  },
  'last-hour': {
    title: '📋 Dernière heure productive',
    body: "Qu'est-ce qui doit absolument être fait avant ce soir ?",
    url: '/?page=today',
  },
  'content': {
    title: '🎬 Contenu & FightFocus',
    body: "Idée TikTok à tourner ? Tâche FightFocus en attente ? 30 min maintenant.",
    url: '/?page=banques',
  },
  'evening-prayer': {
    title: '🙏 Prières du soir',
    body: "Fin de journée — prends 5 minutes pour tes prières du soir.",
    url: '/?page=today',
  },
  'journal': {
    title: '📓 Note ta journée',
    body: "Écris 2 lignes dans Frontkick avant de fermer — dans 30 jours tu seras content.",
    url: '/?page=today&open=note',
  },
  'weekly-review': {
    title: '📊 Bilan de la semaine',
    body: 'Ta semaine est terminée — ton coach a préparé un récap. 2 minutes pour le lire.',
    url: '/?page=coach&bilan=hebdo',
  },
};

// Notifications intelligentes : si l'app a poussé son résumé du jour
// (voir /api/backup), on saute les rappels devenus inutiles.
// Fail-open : sans résumé (ou résumé d'un autre jour), on envoie tout.
const SKIP_RULES = {
  'morning-prayer': s => s.prieres > 0,
  'first-task':     s => s.tachesFaites > 0,
  'sport':          s => s.sport,
  'journal':        s => s.hasNote,
};

async function readDailyState() {
  try {
    const { blobs } = await list({
      prefix: 'daily-state',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!blobs.length) return null;
    const r = await fetch(`${blobs[0].url}?ts=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const state = await r.json();
    const todayParis = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
    return state?.date === todayParis ? state : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const t = req.query.t;
  const notif = NOTIFICATIONS[t];
  if (!notif) return res.status(400).json({ error: 'Type inconnu' });

  // Skip intelligent si l'état du jour montre que c'est déjà fait
  if (SKIP_RULES[t]) {
    const state = await readDailyState();
    if (state && SKIP_RULES[t](state)) {
      return res.status(200).json({ ok: true, skipped: t, reason: 'déjà fait selon le résumé du jour' });
    }
  }

  try {
    const { blobs } = await list({
      prefix: 'push-sub',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs.length) {
      return res.status(200).json({ ok: true, msg: 'Aucune subscription' });
    }

    const payload = JSON.stringify({ title: notif.title, body: notif.body, url: notif.url });
    let sent = 0, expired = 0, failed = 0;

    for (const blob of blobs) {
      try {
        const subResponse = await fetch(blob.url);
        if (!subResponse.ok) { failed++; continue; }
        const subscription = await subResponse.json();
        await webpush.sendNotification(subscription, payload, { TTL: 3600 });
        sent++;
      } catch (e) {
        // 404/410 = souscription expirée ou désinscrite → on nettoie le blob
        if (e.statusCode === 404 || e.statusCode === 410) {
          expired++;
          try { await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch { /* déjà supprimé */ }
        } else {
          failed++;
          console.error('Push error:', e.message);
        }
      }
    }

    res.status(200).json({ ok: sent > 0 || blobs.length === expired, type: t, sent, expired, failed });
  } catch (e) {
    console.error('Push error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
