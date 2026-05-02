import { useState } from 'react';
import Modal from '../Modal';
import { seancesGym } from '../../data/seances_gym';
import { seancesMaison } from '../../data/seances_maison';

export default function SeanceSelector({ open, lieu, onSelect, onClose }) {
  const [dureeFilter, setDureeFilter] = useState(null);

  const all = lieu === 'gym' ? seancesGym : seancesMaison;

  const filtered = all.filter(s => {
    if (!dureeFilter) return true;
    if (dureeFilter === 'court') return s.duree <= 20;
    if (dureeFilter === 'moyen') return s.duree > 20 && s.duree <= 40;
    if (dureeFilter === 'long') return s.duree > 40;
    return true;
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choisir une séance"
      footer={
        <button onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
          Annuler
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {[
            { key: 'court', label: '⚡ Court' },
            { key: 'moyen', label: '⏱ Moyen' },
            { key: 'long', label: '🏆 Long' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDureeFilter(dureeFilter === key ? null : key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={dureeFilter === key
                ? { background: '#27AE60', color: '#fff' }
                : { background: '#F3F4F6', color: '#374151' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Aucune séance pour ce filtre
            </p>
          ) : filtered.map(s => (
            <div key={s.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-gray-800">{s.nom}</p>
                <span className="text-xs text-gray-400 ml-2 shrink-0">{s.duree} min</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{s.type}</p>
              <div className="mb-2">
                {s.exercices.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-gray-500">• {e.nom} ({e.series}×{e.reps})</p>
                ))}
                {s.exercices.length > 3 && (
                  <p className="text-xs text-gray-400">+{s.exercices.length - 3} autres…</p>
                )}
              </div>
              {s.materiel && (
                <p className="text-xs text-gray-400 mb-2">Matériel : {s.materiel}</p>
              )}
              <button
                onClick={() => onSelect(s)}
                className="w-full py-2 rounded-lg text-sm font-medium text-white active:opacity-90 transition-opacity"
                style={{ background: '#27AE60' }}
              >
                Lancer cette séance
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
