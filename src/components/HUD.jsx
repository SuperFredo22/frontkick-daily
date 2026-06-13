import { Flame, ChevronRight, Shield } from 'lucide-react';

/**
 * Combatant HUD — the "open like a game" header.
 * Shows rank + level badge, animated XP bar, and the win-streak flame.
 * Tapping it opens the full Progression screen.
 */
export default function HUD({ prog, onOpen }) {
  const {
    level, rank, intoLevel, levelSpan, toNext, progress,
    winStreak, totalXP,
  } = prog;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left btn-press"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        padding: '16px 16px 14px',
        background: 'var(--grad-surface)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Ambient rank glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: -40, right: -30, width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center gap-3" style={{ position: 'relative' }}>
        {/* Level medallion */}
        <div
          className="flex flex-col items-center justify-center shrink-0"
          style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'var(--grad-rank)',
            boxShadow: 'var(--glow-violet)',
          }}
        >
          <span className="font-display" style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1, letterSpacing: '0.08em' }}>
            NV
          </span>
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {level}
          </span>
        </div>

        {/* Rank + XP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Shield size={13} style={{ color: rank.color }} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {rank.name}
            </span>
            <ChevronRight size={15} style={{ color: 'var(--ink-3)', marginLeft: 'auto' }} />
          </div>

          {/* XP bar */}
          <div className="mt-2" style={{ position: 'relative', height: 9, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div
              className="xp-shimmer"
              style={{
                position: 'absolute', inset: 0, width: `${Math.max(4, progress * 100)}%`,
                background: 'var(--grad-xp)',
                borderRadius: 6,
                transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)' }}>
              {intoLevel} / {levelSpan} XP
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--orange)' }}>
              {toNext} XP → NV {level + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Win streak banner */}
      <div
        className="flex items-center gap-2 mt-3 pt-3"
        style={{ borderTop: '1px solid var(--line-2)' }}
      >
        <Flame size={16} className={winStreak > 0 ? 'flame-pulse' : ''} style={{ color: winStreak > 0 ? 'var(--orange)' : 'var(--ink-3)' }} />
        <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>
          {winStreak > 0 ? (
            <>
              <span className="font-display" style={{ color: 'var(--ink)', fontWeight: 700 }}>{winStreak}</span>
              {' '}victoire{winStreak > 1 ? 's' : ''} d'affilée
            </>
          ) : (
            'Lance ta série — accomplis une mission'
          )}
        </span>
        <span className="font-display" style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
          {totalXP.toLocaleString('fr-FR')} XP
        </span>
      </div>
    </button>
  );
}
