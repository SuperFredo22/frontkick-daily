import { useState, useEffect, useRef } from 'react';
import { beep, unlockAudio } from '../../utils/sound';

function fmt(sec) {
  if (sec < 0) sec = 0;
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

// Parse "5 minutes" / "30 secondes" / "2 min" → seconds, or null
function parseDuration(reps) {
  if (!reps) return null;
  const s = String(reps).toLowerCase();
  const m = s.match(/(\d+)\s*min/);
  const sc = s.match(/(\d+)\s*s(?:ec)?/);
  if (m) return parseInt(m[1]) * 60;
  if (sc) return parseInt(sc[1]);
  return null;
}

const TIMER_PRESETS = [
  { label: '30s', secs: 30 },
  { label: '45s', secs: 45 },
  { label: '1 min', secs: 60 },
  { label: '2 min', secs: 120 },
  { label: '3 min', secs: 180 },
];

export default function SeanceEnCours({ seance, onTerminer, onAbandon }) {
  const [chrono, setChrono]           = useState(0);
  const [restTime, setRestTime]       = useState(null);
  const [seriesTimer, setSeriesTimer] = useState(null); // null = off
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [seriesDone, setSeriesDone]   = useState(() => seance.exercices.map(() => 0));
  const [showPicker, setShowPicker]   = useState(false);
  const [customSecs, setCustomSecs]   = useState('');

  // Timestamp refs — accurate even after screen wake / background return.
  // The session start is captured once at mount; reading the clock for the
  // initial ref value is intentional, not a render-purity concern.
  // eslint-disable-next-line react-hooks/purity
  const sessionStartRef       = useRef(Date.now());
  const restStartRef          = useRef(null);
  const restDurationRef       = useRef(null);
  const seriesTimerStartRef   = useRef(null);
  const seriesTimerDurRef     = useRef(null);
  // true quand le chrono a été lancé pour la durée propre de l'exercice
  // (shadow « 3 min », gainage « 30 sec »…) : sa fin valide la série.
  const seriesTimerAutoRef    = useRef(false);

  const exercices   = seance.exercices;
  const ex          = exercices[currentExIdx];
  const doneThisEx  = seriesDone[currentExIdx];
  const totalSeries = exercices.reduce((s, e) => s + e.series, 0);
  const doneSeries  = seriesDone.reduce((a, b) => a + b, 0);
  const progress    = totalSeries > 0 ? doneSeries / totalSeries : 0;
  const exComplete  = doneThisEx >= ex.series;
  const isWarmup    = ex.nom?.toLowerCase().includes('chauffement');
  const timedSecs   = parseDuration(ex.reps);

  // ── Wake Lock: keep screen on ────────────────────────────────────────────
  useEffect(() => {
    let wl = null;
    let dead = false;

    const acquire = async () => {
      if (dead || !('wakeLock' in navigator)) return;
      try {
        wl = await navigator.wakeLock.request('screen');
        wl.addEventListener('release', () => { wl = null; });
      } catch { /* wake lock unsupported */ }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !wl) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      dead = true;
      wl?.release();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // ── Timestamp-based tick (500ms for responsiveness) ──────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setChrono(Math.floor((Date.now() - sessionStartRef.current) / 1000));

      if (restStartRef.current !== null) {
        const rem = restDurationRef.current - Math.floor((Date.now() - restStartRef.current) / 1000);
        setRestTime(rem <= 0 ? 0 : rem);
      }

      if (seriesTimerStartRef.current !== null) {
        const rem = seriesTimerDurRef.current - Math.floor((Date.now() - seriesTimerStartRef.current) / 1000);
        setSeriesTimer(rem <= 0 ? 0 : rem);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const startRest = (dur) => {
    restStartRef.current = Date.now();
    restDurationRef.current = dur;
    setRestTime(dur);
  };

  const clearRest = () => {
    restStartRef.current = null;
    setRestTime(null);
  };

  const startSeriesTimer = (dur, auto = false) => {
    unlockAudio();
    // eslint-disable-next-line react-hooks/purity -- runs on user action, not during render
    seriesTimerStartRef.current = Date.now();
    seriesTimerDurRef.current = dur;
    seriesTimerAutoRef.current = auto;
    setSeriesTimer(dur);
    setShowPicker(false);
    setCustomSecs('');
  };

  const clearSeriesTimer = () => {
    seriesTimerStartRef.current = null;
    seriesTimerAutoRef.current = false;
    setSeriesTimer(null);
    setShowPicker(false);
  };

  // Valide une série de l'exercice courant et lance le repos si besoin.
  const valideSerie = () => {
    if (exComplete) return;
    const newDone = doneThisEx + 1;
    setSeriesDone(prev => prev.map((d, i) => i === currentExIdx ? newDone : d));
    if (ex.repos > 0 && newDone < ex.series) startRest(ex.repos);
  };

  const goTo = (idx) => {
    setCurrentExIdx(idx);
    clearRest();
    clearSeriesTimer();
    setShowPicker(false);
  };

  // Rest timer end — when the countdown reaches 0, beep and clear it. Resetting
  // to null here is the intended side effect of the timer ending.
  useEffect(() => {
    if (restTime === 0) {
      beep(880, 0.35);
      restStartRef.current = null;
      setRestTime(null); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [restTime]);

  // Series timer end — beep, clear, and for a timed exercise (chrono lancé
  // pour la durée de la série, ex. shadow 3 min) valide la série + repos.
  useEffect(() => {
    if (seriesTimer === 0) {
      beep(660, 0.5);
      seriesTimerStartRef.current = null;
      const wasAuto = seriesTimerAutoRef.current;
      seriesTimerAutoRef.current = false;
      setSeriesTimer(null); // eslint-disable-line react-hooks/set-state-in-effect
      if (wasAuto) valideSerie();
    }
  }, [seriesTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSerieFaite = () => {
    if (exComplete) return;
    unlockAudio();
    clearSeriesTimer();
    valideSerie();
  };

  const handleTerminer = () => {
    const done = exercices.filter((e, i) => seriesDone[i] >= e.series).length;
    onTerminer({
      duree_reelle: Math.max(1, Math.round(chrono / 60)),
      exercices_completes: done,
      exercices_totaux: exercices.length,
      series_cochees: doneSeries,
      series_totales: totalSeries,
    });
  };

  const progressBlocks = Array.from({ length: ex.series }, (_, i) =>
    i < doneThisEx ? '█' : '░'
  ).join('');

  // Reusable dark control style
  const ctrl = { background: 'var(--surface-2)', border: '1px solid var(--line)' };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col z-[9999]" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--line)' }}>
        <button onClick={onAbandon} className="text-sm font-medium py-1 px-2" style={{ color: 'var(--ink-3)' }}>
          ✕ Abandon
        </button>
        <span className="text-xl font-bold font-mono" style={{ color: 'var(--ink)' }}>{fmt(chrono)}</span>
        <span className="text-sm" style={{ color: 'var(--ink-3)' }}>{doneSeries}/{totalSeries}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 shrink-0" style={{ background: 'var(--line)' }}>
        <div className="h-1 transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'var(--grad-xp)' }} />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-4 overflow-y-auto">

        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--ink-3)' }}>
          Exercice {currentExIdx + 1} / {exercices.length}
          {isWarmup && <span className="ml-2" style={{ color: 'var(--orange)' }}>· Échauffement</span>}
        </p>
        <h2 className="text-2xl font-bold font-display mb-1 leading-tight" style={{ color: 'var(--ink)' }}>{ex.nom}</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
          {ex.series} série{ex.series > 1 ? 's' : ''} · {ex.reps}
          {ex.repos > 0 ? ` · repos ${ex.repos}s` : ''}
        </p>

        {/* Series progress */}
        <div className="mb-5">
          <p className="font-mono text-2xl tracking-widest mb-1" style={{ color: 'var(--cyan)' }}>{progressBlocks}</p>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Série {Math.min(doneThisEx + 1, ex.series)}/{ex.series}</p>
        </div>

        {/* Rest timer */}
        {restTime !== null && (
          <div className="rounded-2xl p-5 text-center mb-5" style={ctrl}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--ink-3)' }}>Repos</p>
            <p className="text-5xl font-bold font-mono mb-3" style={{ color: 'var(--cyan)' }}>{fmt(restTime)}</p>
            <button onClick={clearRest} className="text-xs underline" style={{ color: 'var(--ink-3)' }}>Passer</button>
          </div>
        )}

        {/* Series chrono */}
        {seriesTimer !== null && (
          <div className="rounded-2xl p-5 text-center mb-5" style={{ background: 'var(--violet-soft)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--violet)' }}>Chrono</p>
            <p className="text-5xl font-bold font-mono mb-3" style={{ color: 'var(--ink)' }}>{fmt(seriesTimer)}</p>
            <button onClick={clearSeriesTimer} className="text-xs underline" style={{ color: 'var(--violet)' }}>
              Arrêter
            </button>
          </div>
        )}

        {/* Actions (hidden during rest) */}
        {restTime === null && (
          <div className="flex flex-col gap-3 mb-4">

            {/* Main CTA — enchaîne naturellement : série → exercice suivant → fin */}
            {!exComplete ? (
              <button
                onClick={handleSerieFaite}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform"
                style={{ background: 'var(--cyan)', color: '#06121A' }}
              >
                ✅ Série faite
              </button>
            ) : currentExIdx < exercices.length - 1 ? (
              <button
                onClick={() => goTo(currentExIdx + 1)}
                className="w-full py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform"
                style={{ background: 'var(--cyan)', color: '#06121A' }}
              >
                ✅ Exercice terminé — suivant ►
              </button>
            ) : (
              <button
                onClick={handleTerminer}
                className="w-full py-4 rounded-2xl font-bold text-base text-white active:scale-95 transition-transform"
                style={{ background: 'var(--grad-fire)' }}
              >
                🏆 Séance terminée — enregistrer
              </button>
            )}

            {/* Chrono button — direct pour les exercices chronométrés (shadow, gainage…) */}
            {seriesTimer === null && !exComplete && (
              <>
                <button
                  onClick={() => {
                    if (timedSecs) {
                      startSeriesTimer(timedSecs, true);
                    } else {
                      setShowPicker(p => !p);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl font-medium text-sm"
                  style={{ ...ctrl, color: 'var(--violet)' }}
                >
                  {timedSecs
                    ? `⏱ ${isWarmup ? "Lancer l'échauffement" : 'Lancer la série'} · ${fmt(timedSecs)}`
                    : '⏱ Lancer un chrono'
                  }
                </button>
                {timedSecs && !showPicker && (
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs underline self-center -mt-1"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    Autre durée
                  </button>
                )}
              </>
            )}

            {/* Timer picker */}
            {showPicker && seriesTimer === null && (
              <div className="rounded-xl p-3" style={ctrl}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TIMER_PRESETS.map(p => (
                    <button
                      key={p.secs}
                      onClick={() => startSeriesTimer(p.secs)}
                      className="flex-1 py-2 rounded-lg font-medium text-sm"
                      style={{ background: 'var(--surface-3)', color: 'var(--violet)', minWidth: 52 }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Durée en secondes"
                    value={customSecs}
                    onChange={e => setCustomSecs(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--surface-3)', border: 'none', outline: 'none', color: 'var(--ink)' }}
                  />
                  <button
                    onClick={() => { const s = parseInt(customSecs); if (s > 0) startSeriesTimer(s); }}
                    disabled={!customSecs || parseInt(customSecs) <= 0}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: 'var(--violet)', color: '#fff' }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* Skip exercise */}
            <button
              onClick={() => goTo(Math.min(exercices.length - 1, currentExIdx + 1))}
              disabled={currentExIdx === exercices.length - 1}
              className="w-full py-3 rounded-xl font-medium text-sm disabled:opacity-30"
              style={{ ...ctrl, color: 'var(--ink-2)' }}
            >
              ⏭️ Passer cet exercice
            </button>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3 mt-auto pt-2">
          <button
            onClick={() => goTo(Math.max(0, currentExIdx - 1))}
            disabled={currentExIdx === 0}
            className="flex-1 py-3 rounded-xl font-medium text-sm disabled:opacity-30"
            style={{ ...ctrl, color: 'var(--ink-2)' }}
          >
            ◄ Précédent
          </button>
          <button
            onClick={() => goTo(Math.min(exercices.length - 1, currentExIdx + 1))}
            disabled={currentExIdx === exercices.length - 1}
            className="flex-1 py-3 rounded-xl font-medium text-sm disabled:opacity-30"
            style={{ ...ctrl, color: 'var(--ink-2)' }}
          >
            Suivant ►
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-2 shrink-0">
        <button
          onClick={handleTerminer}
          className="w-full py-4 rounded-2xl font-bold text-white text-base active:opacity-90"
          style={{ background: 'var(--grad-fire)' }}
        >
          💪 Terminer la séance
        </button>
      </div>
    </div>
  );
}
