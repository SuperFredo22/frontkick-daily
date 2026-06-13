import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function fmt(sec) {
  if (sec < 0) sec = 0;
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function bell(freq = 880, dur = 0.5) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}

const ROUND_PRESETS = [120, 180, 300];
const REST_PRESETS = [30, 60, 90];

/**
 * Boxing round timer. Configurable rounds × work / rest, with bells on each
 * transition. On finish, logs a training session whose duration is the total
 * work time. Timestamp-based to survive backgrounding.
 */
export default function RoundTimer({ onFinish, onClose }) {
  const [rounds, setRounds] = useState(3);
  const [work, setWork] = useState(180);
  const [rest, setRest] = useState(60);
  const [phase, setPhase] = useState('idle'); // idle | work | rest | done
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(180);
  const [doneMinutes, setDoneMinutes] = useState(0);
  const endRef = useRef(null);
  const phaseRef = useRef('idle');
  const roundRef = useRef(1);

  useEffect(() => {
    let wl = null, dead = false;
    const acquire = async () => { if (!dead && 'wakeLock' in navigator) { try { wl = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } } };
    if (phase === 'work' || phase === 'rest') acquire();
    const onVis = () => { if (document.visibilityState === 'visible' && (phaseRef.current === 'work' || phaseRef.current === 'rest') && !wl) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { dead = true; wl?.release?.(); document.removeEventListener('visibilitychange', onVis); };
  }, [phase]);

  const startPhase = (ph, secs, rnd) => {
    phaseRef.current = ph; roundRef.current = rnd;
    endRef.current = Date.now() + secs * 1000;
    setPhase(ph); setRound(rnd); setRemaining(secs);
  };

  const advance = () => {
    if (phaseRef.current === 'work') {
      bell(660, 0.6); // end of round
      if (roundRef.current >= rounds) { finish(rounds); return; }
      startPhase('rest', rest, roundRef.current);
    } else if (phaseRef.current === 'rest') {
      bell(880, 0.5); // start next round
      startPhase('work', work, roundRef.current + 1);
    }
  };

  // Move to the done screen. `completed` = rounds of work fully done.
  const finish = (completed) => {
    const roundsDone = completed != null
      ? completed
      : (phaseRef.current === 'work' ? roundRef.current - 1 : roundRef.current);
    setDoneMinutes(Math.max(1, Math.round((Math.max(0, roundsDone) * work) / 60)));
    bell(523, 0.9); setTimeout(() => bell(659, 0.9), 250);
    phaseRef.current = 'done'; setPhase('done');
  };

  const save = () => {
    onFinish?.({ type: 'club', duree_reelle: doneMinutes, notes: `${rounds} rounds × ${Math.round(work / 60)} min` });
  };

  const begin = () => { bell(880, 0.5); startPhase('work', work, 1); };

  // Countdown tick (timestamp-based). Placed after advance() so it can call
  // it without a use-before-define; advance reads live config via refs/state.
  useEffect(() => {
    if (phase !== 'work' && phase !== 'rest') return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) { clearInterval(id); advance(); }
    }, 250);
    return () => clearInterval(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = phase === 'rest' ? rest : work;
  const pct = total > 0 ? 1 - remaining / total : 0;
  const R = 130, C = 2 * Math.PI * R;
  const accent = phase === 'rest' ? 'var(--cyan)' : 'var(--red)';

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <span className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>Minuteur de rounds</span>
        <button onClick={onClose} className="btn-press p-1" style={{ color: 'var(--ink-3)' }}><X size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {phase === 'idle' ? (
          <div className="w-full max-w-xs flex flex-col gap-4">
            <Config label="Rounds" value={`${rounds}`} options={[3, 5, 8, 10, 12]} fmt={v => `${v}`} onPick={setRounds} current={rounds} />
            <Config label="Round" value={fmt(work)} options={ROUND_PRESETS} fmt={fmt} onPick={setWork} current={work} />
            <Config label="Repos" value={fmt(rest)} options={REST_PRESETS} fmt={fmt} onPick={setRest} current={rest} />
          </div>
        ) : (
          <>
            <p className="uppercase tracking-widest font-display font-bold mb-3" style={{ fontSize: 14, letterSpacing: '0.1em', color: accent }}>
              {phase === 'done' ? 'Terminé' : phase === 'rest' ? 'Repos' : `Round ${round} / ${rounds}`}
            </p>
            <div style={{ position: 'relative', width: 300, height: 300 }}>
              <svg width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                <circle cx="150" cy="150" r={R} fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${C * pct} ${C}`} style={{ transition: 'stroke-dasharray 300ms linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                {phase === 'done'
                  ? <span style={{ fontSize: 64 }}>🏆</span>
                  : <span className="font-display font-mono" style={{ fontSize: 60, fontWeight: 700, color: 'var(--ink)' }}>{fmt(remaining)}</span>}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-6 pb-10 pt-2">
        {phase === 'idle' && (
          <button onClick={begin} className="btn-press w-full py-4 rounded-2xl font-bold text-white" style={{ background: 'var(--grad-fire)', fontSize: 16 }}>
            🥊 Lancer · {rounds} rounds
          </button>
        )}
        {(phase === 'work' || phase === 'rest') && (
          <button onClick={() => finish()} className="btn-press w-full py-3 rounded-xl font-medium text-sm" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
            Terminer maintenant
          </button>
        )}
        {phase === 'done' && (
          <button onClick={save} className="btn-press w-full py-4 rounded-2xl font-bold text-white" style={{ background: 'var(--grad-fire)', fontSize: 16 }}>
            Enregistrer · {doneMinutes} min
          </button>
        )}
      </div>
    </div>
  );
}

function Config({ label, value, options, fmt, onPick, current }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>{label}</span>
        <span className="font-display font-bold" style={{ color: 'var(--ink)' }}>{value}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onPick(o)}
            className="btn-press flex-1 py-2 rounded-lg text-sm font-medium"
            style={current === o
              ? { background: 'var(--red)', color: '#fff', minWidth: 48 }
              : { background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)', minWidth: 48 }}>
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  );
}
