import { Shield, Quote } from 'lucide-react';

/**
 * "Objectif du jour" — a daily XP target with a progress ring, the mantra of
 * the day, and (when relevant) a one-tap streak-protect offer.
 */
export default function DailyObjective({ todayXP, goal, mantra, tokens, yesterdayMissed, onProtect }) {
  const pct = Math.min(1, goal > 0 ? todayXP / goal : 0);
  const done = todayXP >= goal;

  // Ring geometry
  const R = 26, C = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div
      className="rounded-card p-4"
      style={{ background: 'var(--grad-surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-3.5">
        {/* XP ring */}
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.22,1,0.36,1)' }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--orange)" />
                <stop offset="1" stopColor="var(--red)" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            {done
              ? <span style={{ fontSize: 22 }}>🏆</span>
              : <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{Math.round(pct * 100)}%</span>}
          </div>
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="uppercase tracking-widest text-[10px] font-bold" style={{ color: 'var(--ink-3)' }}>Objectif du jour</p>
          <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
            {done ? 'Objectif atteint 🔥' : `${todayXP} / ${goal} XP`}
          </p>
          {!done && (
            <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>
              Encore <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{goal - todayXP} XP</span> pour gagner ta journée
            </p>
          )}
        </div>
      </div>

      {/* Mantra */}
      <div className="flex items-start gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
        <Quote size={13} style={{ color: 'var(--ink-3)', marginTop: 2, flexShrink: 0 }} />
        <p className="italic" style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>{mantra}</p>
      </div>

      {/* Streak-protect offer */}
      {yesterdayMissed && tokens?.available > 0 && (
        <button
          onClick={onProtect}
          className="btn-press w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ background: 'var(--violet-soft)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--violet)', fontWeight: 600, fontSize: 12.5 }}
        >
          <Shield size={14} />
          Protéger ma série d'hier · {tokens.available} jeton{tokens.available > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
