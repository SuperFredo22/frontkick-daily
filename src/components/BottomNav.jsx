import { useState, useEffect, useRef } from 'react';
import { Sun, Calendar, BarChart3, FolderOpen, Plus, Bot } from 'lucide-react';

const TABS = [
  { id: 'today',   label: "Aujourd'hui", Icon: Sun },
  { id: 'agenda',  label: 'Agenda',       Icon: Calendar },
  { id: 'stats',   label: 'Stats',        Icon: BarChart3 },
  { id: 'coach',   label: 'Coach',        Icon: Bot },
  { id: 'banques', label: 'Banques',      Icon: FolderOpen },
];

const COMPOSE_OPTIONS = [
  { id: 'tiktok',     emoji: '🎬', label: 'Idée TikTok',      color: 'var(--red)' },
  { id: 'fightfocus', emoji: '🎯', label: 'Tâche FightFocus', color: 'var(--cyan)' },
  { id: 'marque',     emoji: '👕', label: 'Action Marque',     color: 'var(--orange)' },
  { id: 'divider' },
  { id: 'agenda',     emoji: '📅', label: 'Nouveau RDV',       color: '#0F172A' },
  { id: 'bonus',      emoji: '⚡', label: 'Tâche bonus',       color: '#0F172A' },
];

function TabItem({ id, label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 btn-press"
      style={{ color: active ? 'var(--red)' : '#9AA3AF' }}
    >
      <span
        style={{
          width: 24, height: 24,
          display: 'grid', placeItems: 'center',
          borderRadius: 8,
          background: active ? 'var(--red-soft)' : 'transparent',
          transition: 'background 150ms ease-out',
        }}
      >
        <Icon size={16} strokeWidth={active ? 2.2 : 2} />
      </span>
      <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
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
          background: 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
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
              active={current === id}
              onClick={() => { setMenuOpen(false); onChange(id); }}
            />
          ))}

          {/* FAB */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="absolute btn-press"
            style={{
              left: '50%',
              top: -22,
              transform: 'translateX(-50%)',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: menuOpen ? '#0F172A' : 'var(--red)',
              color: 'white',
              border: '4px solid var(--bg)',
              boxShadow: 'var(--shadow-fab)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 200ms ease',
              zIndex: 1,
            }}
          >
            <Plus
              size={26}
              strokeWidth={2.2}
              style={{
                transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </button>
        </div>
      </nav>
    </>
  );
}
