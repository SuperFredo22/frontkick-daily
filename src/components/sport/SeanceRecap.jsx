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
      title="Bien joué 💪"
      footer={
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm"
          style={{ background: '#27AE60' }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {seance && (
          <p className="text-sm font-semibold text-gray-700">{seance.nom}</p>
        )}

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{duree_reelle}</p>
            <p className="text-xs text-gray-500 mt-0.5">min</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{pct}%</p>
            <p className="text-xs text-gray-500 mt-0.5">séries</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-700">{exercices_completes}/{exercices_totaux}</p>
            <p className="text-xs text-gray-500 mt-0.5">exercices</p>
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
            }`} style={addAgenda ? { background: '#27AE60' } : {}}>
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
