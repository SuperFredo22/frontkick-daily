// Audio partagé pour tous les minuteurs (séance, rounds, focus).
//
// Un seul AudioContext pour toute l'app : les navigateurs plafonnent le nombre
// de contextes simultanés (~6 sur Chrome) et n'en ferment aucun automatiquement.
// Créer un contexte par bip rendait les minuteurs muets après quelques séries.
// iOS suspend aussi tout contexte créé hors d'un geste utilisateur : appeler
// unlockAudio() depuis le bouton de démarrage garantit que le bip de fin
// (déclenché par le timer, hors geste) pourra sonner.
let ctx = null;

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** À appeler depuis un geste utilisateur (clic « Démarrer », « Série faite »…). */
export function unlockAudio() {
  try {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  } catch { /* audio indisponible */ }
}

/** Bip court (fréquence en Hz, durée en secondes) + vibration si supportée
 *  (téléphone en silencieux pendant l'entraînement : le retour haptique
 *  reste perceptible même sans le son). */
export function beep(freq = 880, dur = 0.5, gain = 0.3) {
  try { navigator.vibrate?.(Math.round(dur * 400)); } catch { /* non supporté */ }
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.start();
    o.stop(c.currentTime + dur);
  } catch { /* audio indisponible */ }
}
