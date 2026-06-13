import { useState } from 'react';
import Modal from '../Modal';

export default function SeanceRecap({ open, seance, data, onSave, onClose }) {
  const [notes, setNotes] = useState('');
  const [addAgenda, setAddAgenda] = useState(false);
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');

  if (!data) return null;

  const { duree_reelle, series_cochees, series_totales, exercices_completes, exercices_totaux } = data;
  const pct = series_totales > 0 ? Math.round((series_cochees / series_totales) * 100) : 0;

  const handleSave = () => {
    const timeSlot = addAgenda && heureDebut && heureFin
      ? { debut: heureDebut, fin: heureFin }
      : null;
    onSave(notes, timeSlot);
    setNotes('');
    setAddAgenda(false);
    setHeureDebut('');
    setHeureFin('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Victoire 💪"
      footer={
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-lg text-white font-bold text-sm"
          style={{ background: 'var(--grad-fire)' }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {seance && (
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{seance.nom}</p>
        )}

        {/* XP reward */}
        <div className="reward-pop flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{ background: 'var(--grad-rank)', boxShadow: 'var(--glow-violet)' }}>
          <span className="text-lg">⚔️</span>
          <span className="font-display font-bold text-base text-white">Entraînement bouclé · +50 XP</span>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--cyan-soft)', border: '1px solid rgba(0,180,216,0.3)' }}>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--cyan)' }}>{duree_reelle}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>min</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{pct}%</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>séries</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <p className="text-xl font-bold font-display" style={{ color: 'var(--ink)' }}>{exercices_completes}/{exercices_totaux}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>exercices</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Notes (optionnel)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Comment s'est passée la séance ?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none bg-gray-50"
            rows={3}
          />
        </div>

        {/* Agenda toggle */}
        <div>
          <button
            onClick={() => setAddAgenda(a => !a)}
            className="flex items-center gap-2 text-sm text-gray-600 font-medium"
          >
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${
              addAgenda ? 'text-white border-green-500' : 'border-gray-300'
            }`} style={addAgenda ? { background: 'var(--green)' } : {}}>
              {addAgenda ? '✓' : ''}
            </span>
            Ajouter à l'agenda
          </button>
          {addAgenda && (
            <div className="flex gap-4 mt-3">
              <label className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Début</span>
                <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Fin</span>
                <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </label>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
