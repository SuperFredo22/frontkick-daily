import { useState } from 'react';
import { XP } from '../../utils/gamification';

// Actions rapides pour loguer en un tap une "action importante" hors-liste —
// dont le travail de refonte de l'app. Chacune devient une action enregistrée
// qui rapporte de l'XP et alimente les stats du mois.
const ACTIONS_RAPIDES = [
  "🛠️ Travail sur l'app",
  '📚 Apprentissage',
  '🤝 Networking / contact',
  '🧹 Admin & organisation',
];

// "Autres actions importantes" — quick-log meaningful off-list work. The parent
// controls whether the free-text input is open (so the FAB can open it), but
// the text field state lives here.
export default function ActionsImportantes({ bonus, showInput, onOpen, onClose, onAdd, onAddQuick, onRemove }) {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
    onClose();
  };

  const cancel = () => { setText(''); onClose(); };

  return (
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-1">
        <p className="uppercase tracking-widest text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>
          Autres actions importantes
        </p>
        {!showInput && (
          <button
            onClick={onOpen}
            className="w-7 h-7 rounded-full text-white text-lg font-bold flex items-center justify-center btn-press"
            style={{ background: 'var(--red)', fontSize: 18, lineHeight: 1 }}
          >
            +
          </button>
        )}
      </div>
      <p className="text-[11px] mb-3" style={{ color: 'var(--ink-3)' }}>
        Tout travail qui compte — dont la refonte de cette app. +{XP.bonus} XP chacun.
      </p>

      {/* Actions rapides — un tap = loguée */}
      {!showInput && (
        <div className="flex flex-wrap gap-2 mb-3">
          {ACTIONS_RAPIDES.map(a => (
            <button
              key={a}
              onClick={() => onAddQuick(a)}
              className="btn-press text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {showInput && (
        <div className="mb-3" style={{ background: 'var(--surface)', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-card)' }}>
          <input
            autoFocus value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') cancel(); }}
            placeholder="Ce que tu as accompli..."
            className="w-full text-sm mb-2"
            style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)', fontSize: 14 }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg text-sm font-medium btn-press"
              style={{ background: 'var(--line-2)', color: 'var(--ink-2)' }}
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="px-3 py-1.5 rounded-lg text-white text-sm font-medium btn-press disabled:opacity-40"
              style={{ background: 'var(--red)' }}
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {bonus.length === 0 && !showInput && (
        <p className="text-sm italic" style={{ color: 'var(--ink-3)' }}>Choisis une action rapide ci-dessus ou ajoute la tienne.</p>
      )}
      <div className="flex flex-col gap-2">
        {bonus.map(b => (
          <div key={b.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-card">
            <span className="text-sm" style={{ color: 'var(--green)' }}>✓</span>
            <span className="text-sm flex-1" style={{ color: 'var(--ink-2)' }}>{b.texte}</span>
            <button onClick={() => onRemove(b.id)} className="text-gray-300 px-1 active:text-red-400">🗑️</button>
          </div>
        ))}
      </div>
    </section>
  );
}
