import { useState } from 'react';
import Modal from '../Modal';
import { SEANCES_MAISON } from '../../data/seances_maison';
import { SEANCES_GYM, SEANCES_CLUB } from '../../data/seances_gym';

const ALL = [...SEANCES_MAISON, ...SEANCES_GYM, ...SEANCES_CLUB];

const DUREE_LABELS = {
  court: '≤20 min',
  moyen: '21-40 min',
  long: '>40 min',
};

export default function SeanceSelector({ open, lieu, onSelect, onClose }) {
  const [duree, setDuree] = useState(null);

  const seances = ALL.filter(s => s.lieu === lieu && (!duree || s.duree === duree));

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
        {/* Durée filter */}
        <div className="flex gap-2">
          {[
            { key: 'court', label: '⚡ Court' },
            { key: 'moyen', label: '⏱ Moyen' },
            { key: 'long', label: '🏆 Long' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDuree(duree === key ? null : key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={duree === key
                ? { background: '#27AE60', color: '#fff' }
                : { background: '#F3F4F6', color: '#374151' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sessions */}
        <div className="flex flex-col gap-2">
          {seances.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Aucune séance pour ce filtre
            </p>
          ) : seances.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left bg-gray-50 rounded-xl p-3 active:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-medium text-gray-800">{s.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {DUREE_LABELS[s.duree]} · {s.exercices.length} exercices
              </p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
