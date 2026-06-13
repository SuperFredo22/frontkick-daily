import { useEffect } from 'react';
import { Shield } from 'lucide-react';

/**
 * Floating "+N XP" flash. `trigger` is a monotonically increasing key — bumping
 * it re-mounts the badge so the pop animation replays. Auto-dismisses.
 */
export function XpFlash({ amount, trigger, onDone }) {
  useEffect(() => {
    if (!trigger) return;
    const t = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(t);
  }, [trigger, onDone]);

  if (!trigger) return null;

  return (
    <div
      key={trigger}
      className="fixed left-1/2 z-[10000] pointer-events-none"
      style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', animation: 'xpRise 1.2s cubic-bezier(0.22,1,0.36,1) forwards' }}
    >
      <div
        className="font-display font-bold flex items-center gap-1.5"
        style={{
          fontSize: 18, color: '#fff', padding: '8px 16px', borderRadius: 999,
          background: 'var(--grad-fire)', boxShadow: 'var(--shadow-fab)', whiteSpace: 'nowrap',
        }}
      >
        ⚔️ +{amount} XP
      </div>
      <style>{`
        @keyframes xpRise {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.7); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
          30%  { transform: translateX(-50%) translateY(0) scale(1); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-44px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}

/**
 * Full-screen level-up celebration. Renders only when `level` is set.
 */
export function LevelUpOverlay({ level, rank, unlocks = [], onClose }) {
  if (level == null) return null;
  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-8"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="reward-pop text-center" style={{ position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', inset: '-40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 65%)' }} />
        <div
          className="mx-auto flex flex-col items-center justify-center"
          style={{ width: 116, height: 116, borderRadius: 28, background: 'var(--grad-rank)', boxShadow: 'var(--glow-violet)', position: 'relative' }}
        >
          <span className="font-display" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em' }}>NIVEAU</span>
          <span className="font-display" style={{ fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{level}</span>
        </div>
        <p className="font-display mt-5" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}>Niveau supérieur !</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Shield size={15} style={{ color: rank?.color || 'var(--violet)' }} />
          <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-2)' }}>Grade : {rank?.name}</span>
        </div>

        {unlocks.length > 0 && (
          <div className="mt-5 flex flex-col gap-2" style={{ position: 'relative' }}>
            <p className="font-display" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--orange)' }}>
              🎁 DÉBLOCAGE
            </p>
            {unlocks.map((u, i) => (
              <div key={i} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                {u.swatch && (
                  <span style={{ width: 26, height: 16, borderRadius: 5, background: `linear-gradient(135deg, ${u.swatch[0]}, ${u.swatch[1]})` }} />
                )}
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.kind}</span>
                <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{u.name}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-press mt-7 px-8 py-3 rounded-2xl font-bold"
          style={{ background: 'var(--grad-fire)', color: '#fff', fontSize: 15 }}
        >
          Continue le combat
        </button>
      </div>
    </div>
  );
}
