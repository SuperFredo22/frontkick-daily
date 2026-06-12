// Client du coach IA (Perplexity Sonar via /api/chat).
// Anciennement gemini.js — renommé après la migration Gemini → Perplexity.

export async function callCoach(apiKey, systemPrompt, history, userMessage) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, systemPrompt, history, userMessage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Pas de réponse.';
}

// La clé est-elle configurée côté serveur (env var Vercel) ?
export async function hasServerKey() {
  try {
    const res = await fetch('/api/chat');
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.serverKey;
  } catch {
    return false;
  }
}
