import { useState, useEffect, useRef } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { beep, unlockAudio } from '../utils/sound';

const PRESETS = [15, 25, 50];

function fmt(sec) {
  if (sec < 0) sec = 0;
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

/**
 * Focus (Pomodoro) overlay. Runs a countdown on a single mission; finishing
 * the round (naturally or via "Terminer") completes the mission with bonus XP.
 * Timestamp-based so it survives screen sleep / backgrounding.
 */
export default function FocusOverlay({ label, color = 'var(--red)', onComplete, onClose }) {
  const [mins, setMins] = useState(25);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const endRef = useRef(null);
  const remainingRef = useRef(25 * 60);

  // Wake lock while running
  useEffect(() => {
    let wl = null, dead = false;
    const acquire = async () => {
      if (dead || !running || !('wakeLock' in navigator)) return;
      try { wl = await navigator.wakeLock.request('screen'); } catch { /* ignore */ }
    };
    if (running) acquire();
    const onVis = () => { if (document.visibilityState === 'visible' && running && !wl) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { dead = true; wl?.release?.(); document.removeEventListener('visibilitychange', onVis); };
  }, [running]);

  // Countdown tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      remainingRef.current = rem;
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(id);
        setRunning(false);
        beep(760, 0.6);
        onComplete?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, onComplete]);

  const start = () => {
    unlockAudio();
    const secs = remainingRef.current > 0 && remainingRef.current < mins * 60 ? remainingRef.current : mins * 60;
    endRef.current = Date.now() + secs * 1000;
    setRemaining(secs);
    setRunning(true);
  };
  const pause = () => {
    remainingRef.current = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
    setRunning(false);
  };
  const pickPreset = (m) => { setMins(m); remainingRef.current = m * 60; setRemaining(m * 60); };

  const total = mins * 60;
  const pct = total > 0 ? 1 - remaining / total : 0;
  const R = 130, C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <span className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>Mode Focus</span>
        <button onClick={onClose} className="btn-press p-1" style={{ color: 'var(--ink-3)' }}><X size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <p className="font-display text-center mb-8" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{label}</p>

        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <svg width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle cx="150" cy="150" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${C * pct} ${C}`} style={{ transition: 'stroke-dasharray 300ms linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <span className="font-display font-mono" style={{ fontSize: 56, fontWeight: 700, color: 'var(--ink)' }}>{fmt(remaining)}</span>
          </div>
        </div>

        {!running && remaining === mins * 60 && (
          <div className="flex gap-2 mt-8">
            {PRESETS.map(m => (
              <button key={m} onClick={() => pickPreset(m)}
                className="btn-press px-4 py-2 rounded-xl font-semibold text-sm"
                style={mins === m
                  ? { background: color, color: '#fff' }
                  : { background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                {m} min
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-2 flex flex-col gap-3">
        <button onClick={running ? pause : start}
          className="btn-press w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: color, fontSize: 16 }}>
          {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {remaining < mins * 60 ? 'Reprendre' : 'Démarrer le focus'}</>}
        </button>
        <button onClick={onComplete}
          className="btn-press w-full py-3 rounded-xl font-medium text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
          ✓ Terminer la mission maintenant
        </button>
      </div>
    </div>
  );
}
