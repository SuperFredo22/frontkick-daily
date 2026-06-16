import Card from '../Card';

// "Déjà fait aujourd'hui" — recap of the day's completed missions, postponed
// items and a habits summary line. Purely presentational; the parent owns the
// data and the undo handler.
export default function VictoiresDuJour({ tachesFaites, tachesReportees, hab, sportDone, sportLabel, onUndoFait }) {
  if (tachesFaites.length === 0 && tachesReportees.length === 0) return null;

  return (
    <section className="px-4 mt-6 mb-2">
      <p className="uppercase tracking-widest text-[11px] font-bold mb-3" style={{ color: 'var(--ink-3)' }}>
        Victoires du jour · {tachesFaites.length}
      </p>
      <Card>
        {tachesFaites.map((t, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--green-soft)' }}
            >
              <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>✓</span>
            </span>
            <span className="text-[13px] flex-1 leading-snug" style={{ color: 'var(--ink-2)', textDecoration: 'line-through', textDecorationColor: '#CBD5E1' }}>
              {t.label}
            </span>
            <button
              onClick={() => onUndoFait(t)}
              className="text-xs px-1.5 py-0.5 rounded btn-press shrink-0"
              style={{ background: 'var(--line-2)', color: 'var(--ink-3)', fontSize: 11 }}
            >
              ↩️
            </button>
          </div>
        ))}
        {tachesReportees.length > 0 && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>🔄 Reporté</p>
            {tachesReportees.map((t, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="text-xs mt-0.5" style={{ color: 'var(--line)' }}>●</span>
                <span className="text-xs leading-snug" style={{ color: 'var(--ink-3)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t flex gap-4 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
          <span>🙏 {hab.prieres || 0}</span>
          <span>{sportDone ? `🥊 ${sportLabel || '✓'}` : '🥊 —'}</span>
          <span>🚬 {hab.cigarettes || 0}</span>
        </div>
      </Card>
    </section>
  );
}
