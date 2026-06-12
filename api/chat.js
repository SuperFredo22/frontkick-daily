export default async function handler(req, res) {
  // GET → l'app demande si une clé est configurée côté serveur
  // (variable d'environnement Vercel PERPLEXITY_API_KEY)
  if (req.method === 'GET') {
    return res.status(200).json({ serverKey: !!process.env.PERPLEXITY_API_KEY });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { apiKey, systemPrompt, history, userMessage } = req.body;

  // Clé serveur prioritaire ; fallback sur la clé fournie par le client
  const key = process.env.PERPLEXITY_API_KEY || apiKey;

  if (!key) {
    return res.status(401).json({ error: { code: 'NO_API_KEY', message: 'Aucune clé API configurée' } });
  }
  if (!userMessage) {
    return res.status(400).json({ error: { message: 'Paramètres manquants' } });
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: userMessage },
  ];

  try {
    const upstream = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
