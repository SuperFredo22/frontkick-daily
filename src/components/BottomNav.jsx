import { useState, useEffect, useRef } from 'react';
import { Swords, Calendar, TrendingUp, FolderOpen, Plus, Bot } from 'lucide-react';

const TABS = [
  { id: 'today',   label: 'Combat',      Icon: Swords },
  { id: 'agenda',  label: 'Agenda',      Icon: Calendar },
  { id: 'stats',   label: 'Progression', Icon: TrendingUp },
  { id: 'compose', label: 'Ajouter',     Icon: Plus },
  { id: 'banques', label: 'Arsenal',     Icon: FolderOpen },
];

const COMPOSE_OPTIONS = [
  { id: 'tiktok',     emoji: '🎬', label: 'Idée TikTok',         color: 'var(--red)' },
  { id: 'video_tournee', emoji: '📹', label: 'Vidéo tournée',     color: 'var(--green)' },
  { id: 'fightfocus', emoji: '🎯', label: 'Mission FightFocus',  color: 'var(--cyan)' },
  { id: 'marque',     emoji: '👕', label: 'Action Marque',       color: 'var(--orange)' },
  { id: 'divider' },
  { id: 'agenda',     emoji: '📅', label: 'Nouveau RDV',         color: 'var(--surface-3)' },
  { id: 'bonus',      emoji: '⚡', label: 'Mission bonus',        color: 'var(--violet)' },
];

function TabItem({ label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 btn-press"
      style={{ color: active ? 'var(--red)' : 'var(--ink-3)' }}
    >
      <span
        style={{
          width: 26, height: 26,
          display: 'grid', placeItems: 'center',
          borderRadius: 9,
          background: active ? 'var(--red-soft)' : 'transparent',
          transition: 'background 150ms ease-out',
        }}
      >
        <Icon size={17} strokeWidth={active ? 2.4 : 2} />
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.01em' }}>{label}</span>
    </button>
  );
}

export default function BottomNav({ current, onChange, onCompose }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, { capture: true });
    return () => document.removeEventListener('pointerdown', handler, { capture: true });
  }, [menuOpen]);

  const handleCompose = (id) => {
    setMenuOpen(false);
    onCompose?.(id);
  };

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2); // Stats, Coach, Banques

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ background: 'rgba(15,23,42,.15)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Compose menu */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          bottom: 120,
          left: '50%',
          transform: menuOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(8px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          zIndex: 40,
          width: 240,
          background: 'var(--surface)',
          borderRadius: 18,
          padding: 8,
          boxShadow: 'var(--shadow-lift)',
          transition: 'opacity 220ms ease-out, transform 220ms ease-out',
        }}
      >
        {COMPOSE_OPTIONS.map((opt) =>
          opt.id === 'divider' ? (
            <div key="divider" style={{ height: 1, background: 'var(--line)', margin: '4px 8px' }} />
          ) : (
            <button
              key={opt.id}
              onClick={() => handleCompose(opt.id)}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 active:opacity-80 btn-press"
              style={{ background: 'transparent' }}
            >
              <span
                className="flex items-center justify-center text-base shrink-0"
                style={{ width: 30, height: 30, borderRadius: 9, background: opt.color }}
              >
                {opt.emoji}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{opt.label}</span>
            </button>
          )
        )}
      </div>

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(11,11,15,.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--line)',
          padding: '8px 0 22px',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <div className="relative flex">
          {leftTabs.map(({ id, label, Icon }) => (
            <TabItem
              key={id} id={id} label={label} Icon={Icon}
              active={current === id}
              onClick={() => { setMenuOpen(false); onChange(id); }}
            />
          ))}

          {/* Spacer for FAB */}
          <div style={{ width: 64, flexShrink: 0 }} />

          {rightTabs.map(({ id, label, Icon }) => (
            <TabItem
              key={id} id={id} label={label} Icon={Icon}
              active={id === 'compose' ? menuOpen : current === id}
              onClick={id === 'compose'
                ? () => setMenuOpen(o => !o)
                : () => { setMenuOpen(false); onChange(id); }
              }
            />
          ))}

          {/* FAB — Coach principal */}
          <button
            onClick={() => { setMenuOpen(false); onChange('coach'); }}
            className="absolute btn-press"
            style={{
              left: '50%',
              top: -22,
              transform: 'translateX(-50%)',
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: current === 'coach' ? 'var(--grad-rank)' : 'var(--grad-fire)',
              color: 'white',
              border: '4px solid var(--bg)',
              boxShadow: current === 'coach' ? 'var(--glow-violet)' : 'var(--shadow-fab)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 200ms ease, box-shadow 200ms ease',
              zIndex: 1,
            }}
          >
            <Bot size={25} strokeWidth={2.2} />
          </button>
        </div>
      </nav>
    </>
  );
}
