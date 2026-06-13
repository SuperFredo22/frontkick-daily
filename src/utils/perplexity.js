export async function askCoach(apiKey, systemPrompt, history, userMessage) {
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
