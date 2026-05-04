const MODEL = 'gemini-1.5-flash';
const BASE   = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function callGemini(apiKey, systemPrompt, history, userMessage) {
  const url = `${BASE}/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Pas de réponse.';
}
