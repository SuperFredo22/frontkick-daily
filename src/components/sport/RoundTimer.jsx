import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { beep, unlockAudio } from '../../utils/sound';

function fmt(sec) {
  if (sec < 0) sec = 0;
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

const ROUND_PRESETS = [120, 180, 300];
const REST_PRESETS = [30, 60, 90];

/**
 * Boxing round timer. Configurable rounds × work / rest, with bells on each
 * transition. On finish, logs a training session whose duration is the total
 * work time. The whole session is planned as absolute timestamps at start,
 * so backgrounding the app (screen lock during shadow boxing) never drifts:
 * on return the timer lands on the correct round/phase and remaining time.
 */
export default function RoundTimer({ onFinish, onClose }) {
  const [rounds, setRounds] = useState(3);
  const [work, setWork] = useState(180);
  const [rest, setRest] = useState(60);
  const [phase, setPhase] = useState('idle'); // idle | work | rest | done
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(180);
  const [doneMinutes, setDoneMinutes] = useState(0);
  const [doneRounds, setDoneRounds] = useState(0);
  const scheduleRef = useRef([]); // [{ ph, rnd, start, end }] absolute ms
  const phaseRef = useRef('idle');
  const roundRef = useRef(1);
  const running = phase === 'work' || phase === 'rest';

  useEffect(() => {
    let wl = null, dead = false;
    const acquire = async () => { if (!dead && 'wakeLock' in navigator) { try { wl = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } } };
    if (running) acquire();
    const onVis = () => { if (document.visibilityState === 'visible' && (phaseRef.current === 'work' || phaseRef.current === 'rest') && !wl) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { dead = true; wl?.release?.(); document.removeEventListener('visibilitychange', onVis); };
  }, [running]);

  // Seconds of work actually elapsed at `now`, according to the schedule.
  const elapsedWorkSecs = (now) => {
    let secs = 0;
    for (const seg of scheduleRef.current) {
      if (seg.ph !== 'work') continue;
      if (now >= seg.end) secs += (seg.end - seg.start) / 1000;
      else if (now > seg.start) secs += (now - seg.start) / 1000;
    }
    return Math.round(secs);
  };

  // Move to the done screen. `completed` = rounds of work fully done (natural
  // end); when omitted (manual stop) the partial current round counts too.
  const finish = (completed) => {
    const now = Date.now();
    const workSecs = completed != null ? completed * work : elapsedWorkSecs(now);
    const fullRounds = completed != null
      ? completed
      : Math.max(0, phaseRef.current === 'work' ? roundRef.current - 1 : roundRef.current);
    setDoneMinutes(Math.max(1, Math.round(workSecs / 60)));
    setDoneRounds(fullRounds);
    beep(523, 0.9); setTimeout(() => beep(659, 0.9), 250);
    phaseRef.current = 'done'; setPhase('done');
  };

  const save = () => {
    onFinish?.({ type: 'club', duree_reelle: doneMinutes, notes: `${doneRounds} round${doneRounds > 1 ? 's' : ''} × ${Math.round(work / 60)} min` });
  };

  const begin = () => {
    unlockAudio();
    beep(880, 0.5);
    // Plan every phase up-front as absolute timestamps.
    const sched = [];
    let t = Date.now();
    for (let r = 1; r <= rounds; r++) {
      sched.push({ ph: 'work', rnd: r, start: t, end: t + work * 1000 });
      t += work * 1000;
      if (r < rounds) {
        sched.push({ ph: 'rest', rnd: r, start: t, end: t + rest * 1000 });
        t += rest * 1000;
      }
    }
    scheduleRef.current = sched;
    phaseRef.current = 'work'; roundRef.current = 1;
    setPhase('work'); setRound(1); setRemaining(work);
  };

  // Tick: locate the current segment in the schedule by wall clock. Survives
  // backgrounding across any number of phase transitions.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const now = Date.now();
      const seg = scheduleRef.current.find(s => now < s.end);
      if (!seg) { clearInterval(id); finish(rounds); return; }
      if (seg.ph !== phaseRef.current || seg.rnd !== roundRef.current) {
        beep(seg.ph === 'work' ? 880 : 660, seg.ph === 'work' ? 0.5 : 0.6);
        phaseRef.current = seg.ph; roundRef.current = seg.rnd;
        setPhase(seg.ph); setRound(seg.rnd);
      }
      setRemaining(Math.max(0, Math.round((seg.end - now) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

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
