// "Disciplines du jour" — quick habit chips. Prières & cigarettes support
// tap (+1) / long-press (edit) via handler objects supplied by the parent
// (which owns the habit state and the edit modals).
export default function DisciplinesStrip({
  hab, sportDone, sportLabel, prieresProps, cigsProps, onOpenSport, onOpenNote,
}) {
  return (
    <>
      <p className="uppercase tracking-widest text-[11px] font-bold px-5 mt-5 mb-2" style={{ color: 'var(--ink-3)' }}>
        Disciplines du jour
      </p>
      <div
        className="flex gap-2 px-5 pb-1"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Prières — tap = +1, long press = éditer */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: (hab.prieres || 0) > 0 ? 'var(--red-50)' : 'var(--surface)',
            border: `1px solid ${(hab.prieres || 0) > 0 ? '#F4D5D1' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: (hab.prieres || 0) > 0 ? 'var(--red)' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 500,
            userSelect: 'none', WebkitUserSelect: 'none',
            touchAction: 'none',
          }}
          {...prieresProps}
          onContextMenu={e => e.preventDefault()}
          title="Tap = +1 · Maintenir = éditer"
        >
          <span>🙏</span>
          <span>{hab.prieres || 0}</span>
        </button>

        {/* Sport */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: sportDone ? 'var(--green-soft)' : 'var(--surface)',
            border: `1px solid ${sportDone ? '#86EFAC' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: sportDone ? 'var(--green)' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 500,
          }}
          onClick={onOpenSport}
        >
          <span>🥊</span>
          <span>{sportDone ? `✓ ${sportLabel || 'Fait'}` : 'Sport'}</span>
        </button>

        {/* Cigarettes — tap = +1, long press = éditer */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: (hab.cigarettes || 0) === 0 ? 'var(--surface)' : 'var(--orange-soft)',
            border: `1px solid ${(hab.cigarettes || 0) === 0 ? 'var(--line)' : '#F6C89A'}`,
            borderRadius: 14, padding: '8px 12px',
            color: (hab.cigarettes || 0) === 0 ? 'var(--green)' : 'var(--orange)',
            fontSize: 13, fontWeight: 500,
            userSelect: 'none', WebkitUserSelect: 'none',
            touchAction: 'none',
          }}
          {...cigsProps}
          onContextMenu={e => e.preventDefault()}
          title="Tap = +1 · Maintenir = éditer"
        >
          <span>🚬</span>
          <span>{hab.cigarettes || 0}</span>
        </button>

        {/* Note */}
        <button
          className="flex items-center gap-1.5 shrink-0 btn-press"
          style={{
            background: hab.note ? 'var(--red-50)' : 'var(--surface)',
            border: `1px solid ${hab.note ? '#F4D5D1' : 'var(--line)'}`,
            borderRadius: 14, padding: '8px 12px',
            color: hab.note ? 'var(--ink-2)' : 'var(--ink-3)',
            fontSize: 13, fontWeight: 500, maxWidth: 140,
          }}
          onClick={onOpenNote}
        >
          <span>📝</span>
          <span className="truncate">{hab.note || 'Note…'}</span>
        </button>
      </div>
    </>
  );
}
