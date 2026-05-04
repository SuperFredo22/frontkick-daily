import { list } from '@vercel/blob';
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
  },
  'first-task': {
    title: '✅ Première tâche du jour',
    body: "C'est l'heure d'attaquer — ouvre Frontkick et choisis ta priorité.",
  },
  'midday': {
    title: '☀️ Bilan mi-journée',
    body: 'Prières ✓ ? Tâches ? Sport prévu ? Consulte ton coach pour un point rapide.',
  },
  'afternoon': {
    title: '⚡ Focus après-midi',
    body: "L'après-midi commence — reste concentré sur ta priorité du jour.",
  },
  'sport': {
    title: '🥊 C\'est l\'heure du sport',
    body: "Tu as prévu une séance aujourd'hui ? Lance-toi — ça change tout.",
  },
  'last-hour': {
    title: '📋 Dernière heure productive',
    body: "Qu'est-ce qui doit absolument être fait avant ce soir ?",
  },
  'content': {
    title: '🎬 Contenu & FightFocus',
    body: "Idée TikTok à tourner ? Tâche FightFocus en attente ? 30 min maintenant.",
  },
  'evening-prayer': {
    title: '🙏 Prières du soir',
    body: "Fin de journée — prends 5 minutes pour tes prières du soir.",
  },
  'journal': {
    title: '📓 Note ta journée',
    body: "Écris 2 lignes dans Frontkick avant de fermer — dans 30 jours tu seras content.",
  },
};

export default async function handler(req, res) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const t = req.query.t;
  const notif = NOTIFICATIONS[t];
  if (!notif) return res.status(400).json({ error: 'Type inconnu' });

  try {
    const { blobs } = await list({
      prefix: 'push-subscription',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs.length) {
      return res.status(200).json({ ok: true, msg: 'Aucune subscription' });
    }

    const subResponse = await fetch(blobs[0].url);
    if (!subResponse.ok) throw new Error('Lecture subscription échouée');
    const subscription = await subResponse.json();

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: notif.title, body: notif.body }),
      { TTL: 3600 }
    );

    res.status(200).json({ ok: true, sent: t });
  } catch (e) {
    console.error('Push error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
