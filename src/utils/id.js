// Generates a collision-free id. Falls back to timestamp+random when
// crypto.randomUUID is unavailable (old WebViews, http:// dev).
export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
