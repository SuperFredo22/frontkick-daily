import Modal from '../Modal';

// Reusable +/- counter editor in a modal. Used for the prières and cigarettes
// habits (same UI, different accent colour). Controlled: the parent owns the
// value and decides what reset / save do.
export default function CounterModal({ open, onClose, title, value, onChange, onReset, onSave, accent }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2 w-full">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
            style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            Réinitialiser
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm btn-press"
            style={{ background: accent, color: 'white' }}
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
          style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
        >
          −
        </button>
        <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', minWidth: 60, textAlign: 'center' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-12 h-12 rounded-full text-2xl font-bold btn-press flex items-center justify-center"
          style={{ background: accent, color: 'white' }}
        >
          +
        </button>
      </div>
    </Modal>
  );
}
