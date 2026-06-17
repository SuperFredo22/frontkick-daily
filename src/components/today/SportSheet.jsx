import SportModule from '../sport/SportModule';

// Bottom sheet wrapping the sport module. Rendered only when open; the parent
// owns the journal data and the save/clear handlers.
export default function SportSheet({ open, onClose, journal, onSportSave, onSportClear, setAgenda, viewDate }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,23,42,.4)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full"
        style={{
          maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          paddingTop: 12,
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
        <div className="px-4">
          <SportModule
            journal={journal}
            onSportSave={onSportSave}
            onSportClear={onSportClear}
            setAgenda={setAgenda}
            viewDate={viewDate}
          />
        </div>
      </div>
    </div>
  );
}
