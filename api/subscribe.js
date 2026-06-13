import { put, del, list } from '@vercel/blob';
import { createHash } from 'node:crypto';

// Un blob par appareil : push-subs/<sha256(endpoint)>.json
// Le nom est dérivé de l'endpoint (lui-même secret), donc l'URL du blob
// n'est pas devinable sans déjà connaître la souscription.
function blobNameFor(endpoint) {
  const hash = createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
  return `push-subs/${hash}.json`;
}

export default async function handler(req, res) {
  // Pas de header CORS : l'API n'est appelée qu'en same-origin depuis l'app.

  // DELETE — désabonnement de l'appareil courant
  if (req.method === 'DELETE') {
    try {
      const endpoint = req.body?.endpoint;
      const { blobs } = await list({
        prefix: 'push-sub',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      for (const blob of blobs) {
        // Legacy single-subscription blob, ou blob de cet appareil
        const isLegacy = blob.pathname === 'push-subscription.json';
        const isThisDevice = endpoint && blob.pathname === blobNameFor(endpoint);
        if (isLegacy || isThisDevice || !endpoint) {
          await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const subscription = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh) {
      return res.status(400).json({ error: 'Subscription invalide' });
    }

    await put(blobNameFor(subscription.endpoint), JSON.stringify(subscription), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Migration : supprimer l'ancien blob unique s'il existe encore
    try {
      const { blobs } = await list({
        prefix: 'push-subscription.json',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      for (const blob of blobs) {
        await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
    } catch { /* non bloquant */ }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Subscribe error:', e);
    res.status(500).json({ error: e.message });
  }
}
