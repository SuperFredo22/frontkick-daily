import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const env = {
    CRON_SECRET:           !!process.env.CRON_SECRET,
    VAPID_PUBLIC_KEY:      !!process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY:     !!process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT:         !!process.env.VAPID_SUBJECT,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
  };

  const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);

  let subscription = { count: 0, error: null };
  try {
    const { blobs } = await list({
      prefix: 'push-subscription',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    subscription.count = blobs.length;
  } catch (e) {
    subscription.error = e.message;
  }

  return res.status(200).json({
    ok: missing.length === 0 && subscription.count > 0 && !subscription.error,
    env,
    missing,
    subscription,
    hint: missing.length > 0
      ? `Variables manquantes sur Vercel : ${missing.join(', ')}`
      : subscription.count === 0
        ? 'Aucune souscription push — réactive les notifications dans l\'app'
        : 'Tout est configuré correctement',
  });
}
