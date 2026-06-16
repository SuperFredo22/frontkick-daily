// Reminder to export a backup when none was made in a while. Purely
// presentational — the parent decides when to show it (`show`) and what the
// export / dismiss actions do.
export default function BackupBanner({ show, hasBackup, onExport, onDismiss }) {
  if (!show) return null;

  return (
    <div className="mx-4 mt-2 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <span className="text-xl">💾</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Sauvegarde tes données</p>
        <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {hasBackup ? 'Dernier export il y a plus d\'une semaine.' : 'Aucune sauvegarde encore — protège ta progression.'}
        </p>
      </div>
      <button
        onClick={onExport}
        className="btn-press text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
        style={{ background: 'var(--red)' }}
      >
        Exporter
      </button>
      <button
        onClick={onDismiss}
        className="btn-press text-base px-1 shrink-0"
        style={{ color: 'var(--ink-3)' }}
        aria-label="Ignorer"
      >
        ✕
      </button>
    </div>
  );
}
